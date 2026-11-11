// @vitest-environment node

import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Carousel } from '../../components/carousel/carousel.js';
import { Chart } from '../../components/chart/chart.js';
import { LinkPreview } from '../../components/link-preview/link-preview.js';
import { PostkitProvider } from '../provider.js';
import { createPostkitSystem, postkitDefaultTheme } from '../theme.js';

/*
 * P20: Carousel, Chart and LinkPreview hard-coded `h3` titles, which skip a
 * level after an `h1` (axe `heading-order`). Their titles are paragraphs
 * unless the author sets `headingLevel`, and keep the heading style either
 * way.
 */
const system = createPostkitSystem({ preset: postkitDefaultTheme });
const data = [{ label: 'Jan', value: 1 }];
const items = [{ title: 'Slide', description: 'One.' }];
const metadata = {
  url: 'https://example.com/a',
  title: 'An article',
  images: [],
};

function render(node: ReactNode): string {
  return renderToStaticMarkup(
    <PostkitProvider system={system}>{node}</PostkitProvider>,
  );
}

/** The title part's element and class. */
function titleOf(markup: string) {
  const match =
    /<(\w+)\b(?=[^>]*data-postkit-part="title")[^>]*class="([^"]*)"/.exec(
      markup,
    );
  return { element: match?.[1], className: match?.[2] ?? '' };
}

describe('Chakra title heading levels', () => {
  it('render titles as heading-styled paragraphs by default', () => {
    for (const markup of [
      render(<Chart title="Visits" data={data} />),
      render(<Carousel items={items} />),
      render(<LinkPreview href={metadata.url} metadata={metadata} />),
    ]) {
      const title = titleOf(markup);
      expect(title.element).toBe('p');
      expect(title.className).toContain('chakra-heading');
      expect(markup).not.toMatch(/<h[1-6]\b/);
    }
  });

  it('render titles as headings at the authored level', () => {
    expect(
      titleOf(render(<Chart title="Visits" data={data} headingLevel="2" />))
        .element,
    ).toBe('h2');
    expect(
      titleOf(render(<Carousel items={items} headingLevel={4} />)).element,
    ).toBe('h4');
    expect(
      titleOf(
        render(
          <LinkPreview
            href={metadata.url}
            metadata={metadata}
            headingLevel="5"
          />,
        ),
      ).element,
    ).toBe('h5');
  });
});
