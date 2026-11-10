// @vitest-environment node

import { galleryDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Gallery } from './gallery.js';

describe('headless Gallery', () => {
  it('renders the anatomy with its defaults and no styles', () => {
    expect(Gallery.definition).toBe(galleryDefinition);
    expect(
      renderToStaticMarkup(<Gallery items={[{ src: '/a.jpg', alt: 'A' }]} />),
    ).toBe(
      '<div data-postkit-component="Gallery" data-postkit-part="root" data-size="md" data-variant="subtle" data-presentation="grid">' +
        '<div data-postkit-part="grid" style="--postkit-gallery-columns:2">' +
        '<figure data-postkit-part="item">' +
        '<img data-postkit-part="image" src="/a.jpg" alt="A" loading="lazy" decoding="async"/>' +
        '</figure></div></div>',
    );
  });

  it('renders the header, linked images, captions and columns', () => {
    const markup = renderToStaticMarkup(
      <Gallery
        title="Field work"
        description="Two days."
        columns={3}
        items={JSON.stringify([
          { src: '/one.jpg', alt: 'One', caption: 'Day one', width: 800 },
          { src: '/two.jpg', alt: '', href: '/two-full.jpg' },
        ])}
      />,
    );

    expect(markup).toContain(
      '<div data-postkit-part="header"><p data-postkit-part="title">Field work</p>' +
        '<p data-postkit-part="description">Two days.</p></div>',
    );
    expect(markup).toContain('style="--postkit-gallery-columns:3"');
    expect(markup).toContain('width="800"');
    expect(markup).toContain(
      '<figcaption data-postkit-part="caption">Day one</figcaption>',
    );
    expect(markup).toContain(
      '<a data-postkit-part="imageLink" href="/two-full.jpg" aria-label="Open image">',
    );
  });

  it('rejects malformed JSON items', () => {
    expect(() => renderToStaticMarkup(<Gallery items="{" />)).toThrow(
      'Postkit Gallery items must contain valid JSON.',
    );
    expect(() => renderToStaticMarkup(<Gallery items="{}" />)).toThrow(
      'Postkit Gallery items must contain a JSON array.',
    );
  });
});
