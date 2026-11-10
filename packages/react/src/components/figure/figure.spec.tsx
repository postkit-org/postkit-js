// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Figure, postkitImageDimension } from './figure.js';

describe('headless Figure', () => {
  it('renders a bare image with its defaults', () => {
    expect(renderToStaticMarkup(<Figure src="/a.jpg" alt="" />)).toBe(
      '<figure data-postkit-component="Figure" data-postkit-part="root" data-size="md" data-variant="subtle" data-layout="inline">' +
        '<div data-postkit-part="media">' +
        '<img data-postkit-part="image" style="object-fit:cover" src="/a.jpg" alt="" loading="lazy" decoding="async"/>' +
        '</div></figure>',
    );
  });

  it('renders the linked media, caption and credit parts', () => {
    const markup = renderToStaticMarkup(
      <Figure
        src="/studio.jpg"
        alt=""
        caption="The studio."
        credit="Photo"
        creditHref="https://example.com/credit"
        href="/full.jpg"
        width="1600"
        height={900}
        aspectRatio="16 / 9"
        objectPosition="center 30%"
        layout="wide"
      />,
    );

    expect(markup).toContain(
      '<a data-postkit-part="mediaLink" href="/full.jpg" aria-label="The studio.">',
    );
    expect(markup).toContain(
      '<div data-postkit-part="media" style="aspect-ratio:16 / 9">',
    );
    expect(markup).toContain(
      'style="object-fit:cover;object-position:center 30%;height:100%"',
    );
    expect(markup).toContain('width="1600" height="900"');
    expect(markup).toContain(
      '<figcaption data-postkit-part="figcaption"><span data-postkit-part="caption">The studio.</span>' +
        '<span data-postkit-part="credit"><a data-postkit-part="creditLink" href="https://example.com/credit">Photo</a></span></figcaption>',
    );
    expect(markup).toContain('data-layout="wide"');
  });

  it('labels a linked image without alt text or caption', () => {
    expect(
      renderToStaticMarkup(<Figure src="/a.jpg" alt="" href="/b" />),
    ).toContain('aria-label="Open image"');
    expect(
      renderToStaticMarkup(<Figure src="/a.jpg" alt="" credit="Plain" />),
    ).toContain('<span data-postkit-part="credit">Plain</span>');
  });

  it('keeps only positive whole-number dimensions', () => {
    expect(postkitImageDimension('1600px')).toBe(1600);
    expect(postkitImageDimension(12.7)).toBe(12);
    expect(postkitImageDimension('abc')).toBeUndefined();
    expect(postkitImageDimension(-3)).toBeUndefined();
    expect(postkitImageDimension(undefined)).toBeUndefined();
  });
});
