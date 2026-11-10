---
tagline: Make sure the important part gets read.
# Layers top to bottom, ported from SiteComponentCallout's exploded view. Boxes are on the
# flat 400 × 104 component; the root's box is the whole component.
anatomy:
  layers:
    - part: icon
      element: span
      description: 'The tone mark. Recolour it, or swap it with `slots.icon`'
      box: { x: 16, y: 16, w: 30, h: 30 }
    - part: title
      element: p
      description: 'The heading. Font, weight, size'
      box: { x: 52, y: 13, w: 154, h: 30 }
    - part: body
      element: div
      description: 'Your MDX. Inherits your prose styles'
      box: { x: 52, y: 39, w: 326, h: 52 }
    - part: content
      element: div
      description: 'Holds the title and body. Gap and alignment'
      box: { x: 52, y: 13, w: 332, h: 78 }
    - part: root
      element: aside
      description: 'Surface, edge and padding. `variant`, `size`, `--postkit-tone-*`'
      box: { x: 0, y: 0, w: 400, h: 104 }
related:
  - Aside
  - KeyTakeaway
  - Disclosure
---

## Usage

Writers use it however they already write.

Both forms validate against the same definition. A tone that doesn't exist
fails the build with the file and line. Writing in Prismark? The callout
renders inline and its props open in the Components panel. See
[Writing with directives](/docs/markdown-directives).

## Accessibility

Colour is never the only signal.

- The tone mark is decorative. Give the callout a title when the tone matters
  to the reader.
- Body text keeps at least 4.5:1 contrast in every tone and variant.
- In email, the tone becomes a bar and the title stays in the text, so nothing
  depends on CSS support.
