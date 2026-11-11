import {
  createPostkitDocument,
  serializePostkitHtml,
  type PostkitJsonValue,
} from '../index.js';
import {
  carouselDefinition,
  chartDefinition,
  headingLevelProp,
  linkPreviewDefinition,
  postkitHeadingLevels,
  postkitTitleElement,
} from './index.js';

/*
 * P20: Carousel, Chart and LinkPreview hard-coded `h3` titles, which skip a
 * level after an `h1` (axe `heading-order`). Their titles are paragraphs
 * unless the author sets `headingLevel`.
 */
describe('postkitTitleElement', () => {
  it('maps heading levels 2 to 6, as strings or numbers, to their element', () => {
    expect(postkitTitleElement('2')).toBe('h2');
    expect(postkitTitleElement('6')).toBe('h6');
    expect(postkitTitleElement(3)).toBe('h3');
    expect(postkitTitleElement(' 4 ')).toBe('h4');
  });

  it('falls back to a paragraph for no level or one it does not allow', () => {
    for (const level of [undefined, null, '', '1', 1, '7', 2.5, 'h3', true]) {
      expect(postkitTitleElement(level)).toBe('p');
    }
  });
});

describe('headingLevel prop', () => {
  it('is an optional enum of levels 2 to 6 with no default', () => {
    const headingLevel = headingLevelProp('The title heading level.');
    expect(headingLevel).toEqual({
      kind: 'enum',
      values: ['2', '3', '4', '5', '6'],
      description: 'The title heading level.',
      required: false,
      themeVariant: false,
    });
    expect(postkitHeadingLevels).toEqual(['2', '3', '4', '5', '6']);
  });

  it.each([chartDefinition, carouselDefinition, linkPreviewDefinition])(
    '$name declares it',
    (definition) => {
      const headingLevel = (
        definition.props as Record<
          string,
          { values?: unknown; default?: unknown }
        >
      )['headingLevel'];
      expect(headingLevel?.values).toEqual(['2', '3', '4', '5', '6']);
      expect(headingLevel?.default).toBeUndefined();
    },
  );
});

describe('static titles', () => {
  const html = (name: string, props: Record<string, PostkitJsonValue>) =>
    serializePostkitHtml(
      createPostkitDocument([{ type: 'component', name, props, children: [] }]),
    );

  const chart = { title: 'Visits', data: [{ label: 'Jan', value: 1 }] };
  const carousel = {
    items: [{ title: 'Slide', href: 'https://example.com/slide' }],
  };
  const preview = { href: 'https://example.com/a', title: 'An article' };

  it('are bold paragraphs by default', () => {
    expect(html('Chart', chart)).toContain(
      '<p data-postkit-part="title"><strong>Visits</strong></p>',
    );
    expect(html('Carousel', carousel)).toMatch(
      /<p data-postkit-part="title"><strong><a [^>]*>Slide<\/a><\/strong><\/p>/,
    );
    expect(html('LinkPreview', preview)).toMatch(
      /<p data-postkit-part="title"><strong><a [^>]*>An article<\/a><\/strong><\/p>/,
    );
  });

  it('are headings at the authored level', () => {
    expect(html('Chart', { ...chart, headingLevel: '2' })).toContain(
      '<h2 data-postkit-part="title">Visits</h2>',
    );
    expect(html('Carousel', { ...carousel, headingLevel: 4 })).toMatch(
      /<h4 data-postkit-part="title"><a [^>]*>Slide<\/a><\/h4>/,
    );
    expect(html('LinkPreview', { ...preview, headingLevel: '3' })).toMatch(
      /<h3 data-postkit-part="title"><a [^>]*>An article<\/a><\/h3>/,
    );
  });

  it('ignore a level they do not allow', () => {
    expect(html('Chart', { ...chart, headingLevel: '1' })).toContain(
      '<p data-postkit-part="title"><strong>Visits</strong></p>',
    );
  });
});
