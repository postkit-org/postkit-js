// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Carousel } from './carousel/carousel.js';
import { Chart } from './chart/chart.js';
import { LinkPreview } from './link-preview/link-preview.js';

/*
 * P20: Carousel, Chart and LinkPreview hard-coded `h3` titles, which skip a
 * level after an `h1` (axe `heading-order`). Their titles are paragraphs
 * unless the author sets `headingLevel`.
 */
const data = [{ label: 'Jan', value: 1 }];
const items = [{ title: 'Slide', description: 'One.' }];
const metadata = {
  url: 'https://example.com/a',
  title: 'An article',
  images: [],
};

function titleOf(markup: string): string | undefined {
  return /<(\w+) data-postkit-part="title"/.exec(markup)?.[1];
}

describe('headless title heading levels', () => {
  it('render titles as paragraphs by default', () => {
    expect(
      titleOf(renderToStaticMarkup(<Chart title="Visits" data={data} />)),
    ).toBe('p');
    expect(titleOf(renderToStaticMarkup(<Carousel items={items} />))).toBe('p');
    expect(
      titleOf(
        renderToStaticMarkup(
          <LinkPreview href={metadata.url} metadata={metadata} />,
        ),
      ),
    ).toBe('p');
  });

  it('render titles as headings at the authored level', () => {
    expect(
      titleOf(
        renderToStaticMarkup(
          <Chart title="Visits" data={data} headingLevel="2" />,
        ),
      ),
    ).toBe('h2');
    expect(
      titleOf(
        renderToStaticMarkup(<Carousel items={items} headingLevel={4} />),
      ),
    ).toBe('h4');
    expect(
      titleOf(
        renderToStaticMarkup(
          <LinkPreview
            href={metadata.url}
            metadata={metadata}
            headingLevel="5"
          />,
        ),
      ),
    ).toBe('h5');
  });

  it('keep the chart title as the plot name at any level', () => {
    const markup = renderToStaticMarkup(
      <Chart title="Visits" data={data} headingLevel={3} />,
    );
    const id = /<h3 data-postkit-part="title" id="([^"]+)">Visits<\/h3>/.exec(
      markup,
    )?.[1];
    expect(id).toBeDefined();
    expect(markup).toContain(`aria-labelledby="${id}"`);
  });

  it('fall back to a paragraph for a level the definition does not allow', () => {
    expect(
      titleOf(
        renderToStaticMarkup(
          // @ts-expect-error: 1 isn't an allowed heading level.
          <Chart title="Visits" data={data} headingLevel={1} />,
        ),
      ),
    ).toBe('p');
  });
});
