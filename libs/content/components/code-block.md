---
tagline: Code readers can trust, read and copy in one click.
# Layers top to bottom, ported from SiteComponentCodeBlock's exploded view. Boxes are on the
# flat 420 × 176 component; the root's box is the whole component.
anatomy:
  layers:
    - part: copyTrigger
      element: button
      description: 'A real button. Relabel, restyle or swap it'
      box: { x: 360, y: 5, w: 52, h: 28 }
    - part: header
      element: div
      description: 'Filename, language and actions. Hide with `header={false}`'
      box: { x: 4, y: 0, w: 412, h: 36 }
    - part: lineNumber
      element: span
      description: 'Hidden from screen readers. Turn off with `showLineNumbers`'
      box: { x: 10, y: 44, w: 22, h: 113 }
    - part: line
      element: span
      description: 'One line. Highlight it with `{4}` in the fence'
      box: { x: 0, y: 107, w: 420, h: 29 }
    - part: root
      element: div
      description: 'The block. Background and radius. `--postkit-code-*`'
      box: { x: 0, y: 0, w: 420, h: 176 }
related:
  - CodeGroup
  - Terminal
  - Diff
---

## Usage

Paste the code. The rest is optional.

Highlighting comes from an adapter, not the component. Add `@postkit/shiki` for
Shiki; it loads lazily, so pages without code don't pay for it. Long examples
read better as a [CodeGroup](/components/code-group).

## Accessibility

Readable without colour, copyable without a mouse.

- Copy is a real button with a label, and the Copied confirmation is announced.
- Line numbers are hidden from assistive technology, so the code reads
  cleanly.
- Long lines scroll inside the block unless `wrap` is on, and the scroller can
  be reached with the keyboard.
