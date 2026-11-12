// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Carousel } from './carousel.js';

describe('headless Carousel', () => {
  it('renders items as labelled slides with controls and progress', () => {
    const markup = renderToStaticMarkup(
      <Carousel
        label="Photos"
        initialIndex={1}
        items={[
          {
            title: 'A',
            description: 'D',
            href: '/a',
            image: { src: '/a.png', alt: 'A' },
          },
          { title: 'B' },
        ]}
      />,
    );

    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('aria-label="Photos"');
    expect(markup).toContain('data-postkit-component="Carousel"');
    expect(markup.match(/data-postkit-part="slide"/g)).toHaveLength(2);
    expect(markup).toContain(
      '<a data-postkit-part="link" href="/a"><div><img data-postkit-part="media" src="/a.png" alt="A"/>',
    );
    expect(markup).toContain(
      '<div aria-live="polite" data-postkit-part="status">2 / 2</div>',
    );
    expect(markup).toContain('>Previous</button>');
    expect(markup).toContain('>Next</button>');
  });

  it('uses children when there are no items, and an empty state without', () => {
    expect(
      renderToStaticMarkup(
        <Carousel>
          <p>One</p>
          <p>Two</p>
        </Carousel>,
      ).match(/data-postkit-part="slide"/g),
    ).toHaveLength(2);
    expect(renderToStaticMarkup(<Carousel />)).toBe(
      '<div role="note" data-postkit-component="Carousel" data-postkit-part="root" data-size="md" data-variant="subtle" data-presentation="slides">' +
        '<p data-postkit-part="emptyState">This carousel does not have any slides.</p></div>',
    );
  });
});
