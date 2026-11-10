---
tagline: Images that load fast, read well and credit the source.
# Layers top to bottom, ported from SiteComponentFigure's exploded view. Boxes are on the
# flat 360 × 224 component; the root's box is the whole component.
anatomy:
  layers:
    - part: image
      element: img
      description: 'Your image. `alt` is required; `srcSet` passes through'
      box: { x: 6, y: 6, w: 348, h: 178 }
    - part: media
      element: div
      description: 'The frame around it. Radius, ratio, background'
      box: { x: 6, y: 6, w: 348, h: 178 }
    - part: caption
      element: span
      description: 'The caption. Numbered with `figures`'
      box: { x: 6, y: 183, w: 244, h: 26 }
    - part: credit
      element: span
      description: 'Attribution. Linked with `creditHref`'
      box: { x: 6, y: 201, w: 154, h: 23 }
    - part: root
      element: figure
      description: 'The figure. Width with `layout`: inline, wide, full'
      box: { x: 0, y: 0, w: 360, h: 224 }
related:
  - Gallery
  - Carousel
  - Video
---

## Usage

An image, what it shows, and who made it.

Give `width` and `height` and the page reserves the space before the image
loads. Several related images read better as a [Gallery](/components/gallery).

## Accessibility

Every image says what it shows, or that it's decoration.

- `alt` is required. Pass `alt=""` for a decorative image, and the build
  accepts it on purpose.
- The caption and credit sit in `figcaption`, so they're tied to the image.
- With `href` set, the whole image is one link, named by its alt text.
