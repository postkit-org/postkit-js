// @vitest-environment node

import { productCardDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { ProductCard } from './product-card.js';

describe('headless ProductCard', () => {
  it('renders the default action with a sponsored link', () => {
    expect(ProductCard.definition).toBe(productCardDefinition);
    expect(renderToStaticMarkup(<ProductCard title="Guide" href="/g" />)).toBe(
      '<article data-postkit-component="ProductCard" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="content"><p data-postkit-part="title">Guide</p>' +
        '<div data-postkit-part="footer"><span></span>' +
        '<a data-postkit-part="action" href="/g" rel="sponsored">View product</a>' +
        '</div></div></article>',
    );
  });

  it('renders the image, badge, description, rating and price', () => {
    const markup = renderToStaticMarkup(
      <ProductCard
        title="Guide"
        href="/g"
        imageSrc="/g.jpg"
        badge="New"
        description="A field guide."
        rating="4.6"
        price="$20"
        actionLabel="Buy"
        rel="nofollow"
      />,
    );

    expect(markup).toContain(
      '<img data-postkit-part="image" src="/g.jpg" alt="" loading="lazy"/>',
    );
    expect(markup).toContain('<p data-postkit-part="badge">New</p>');
    expect(markup).toContain(
      '<p data-postkit-part="description">A field guide.</p>',
    );
    expect(markup).toContain(
      '<span data-postkit-part="rating" role="img" aria-label="4.6 out of 5 stars">★★★★★</span>',
    );
    expect(markup).toContain('<p data-postkit-part="price">$20</p>');
    expect(markup).toContain('href="/g" rel="nofollow">Buy</a>');
  });

  it('clamps the stars to five', () => {
    expect(
      renderToStaticMarkup(<ProductCard title="T" href="/" rating={2.2} />),
    ).toContain('>★★☆☆☆</span>');
    expect(
      renderToStaticMarkup(<ProductCard title="T" href="/" rating={9} />),
    ).toContain('>★★★★★</span>');
  });
});
