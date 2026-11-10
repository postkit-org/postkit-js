---
tagline: Readers who skim still leave with the point.
# Layers top to bottom, ported from SiteComponentKeyTakeaway's exploded view. Boxes are on the
# flat 400 × 172 component; the root's box is the whole component.
anatomy:
  layers:
    - part: eyebrow
      element: p
      description: 'The label. Reword it with `eyebrow`, or hide it'
      box: { x: 18, y: 16, w: 60, h: 27 }
    - part: title
      element: p
      description: 'The point. Font, weight, size'
      box: { x: 18, y: 39, w: 180, h: 33 }
    - part: item
      element: li
      description: 'One point, repeated per line'
      box: { x: 18, y: 81, w: 270, h: 28 }
    - part: list
      element: ul
      description: 'A real list. Marker and spacing'
      box: { x: 18, y: 81, w: 270, h: 76 }
    - part: root
      element: aside
      description: 'Surface and padding. `variant`, `size`'
      box: { x: 0, y: 0, w: 400, h: 172 }
related:
  - Callout
  - PullQuote
  - Steps
---

## Usage

Write the points the way you'd jot them down.

Use `items` when the points are short and parallel; write a body when one
needs a link or emphasis. In Prismark the items open as a list in the
Components panel.

## Accessibility

A summary should read like one.

- Items render as a real list, so assistive technology announces how many
  points there are.
- Keep the eyebrow to a word or two; it's a label, not the point.
- Text keeps at least 4.5:1 contrast in every variant.
