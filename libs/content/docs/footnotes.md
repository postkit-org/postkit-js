---
title: Footnotes
summary: Write footnotes in Markdown or MDX, and choose where readers see them, from end notes to sidenotes.
category: Writing
order: 4
since: '0.3.0'
status: published
---

Footnotes are part of the portable document, so they survive every renderer:
your site, email, feeds and plain text. Authors write them once, and your site
decides where readers see them: at the end, in the margin, in a popover or
opened under the line.

They render as two components in the `article` [kit](/docs/kits):
[Footnote](/components/footnote), the mark in the text, and
[Footnotes](/components/footnotes), the list of notes.

## Write a footnote

Use GitHub's footnote syntax, in Markdown or MDX. A `[^id]` reference goes in
the text, and a `[^id]:` note can go anywhere in the file:

```md
Postkit numbers notes by first reference.[^order] A note can be referenced
more than once.[^order]

[^order]: The id is a name, not a number. Readers see 1, 2, 3.
```

A short note can go inline. In Markdown, use the `:footnote` text directive;
in MDX, the `Footnote` component with the note as its children:

```md
Directives never run code.:footnote[They take literal strings and JSON.]
```

```mdx
Directives never run code.<Footnote>They take literal strings and JSON.</Footnote>
```

Notes are numbered in the order they're first referenced. A note referenced
more than once is listed once, with a link back to each reference (↩, then
a, b, …). Ids are prefixed per document (`fn-{slug}-1`), so a feed or index
page that shows several posts never repeats one.

## Place the list

The list closes the document. To put it somewhere else, such as before an
author card, place it with a leaf directive in Markdown or the component in
MDX:

```md
::footnotes
```

```mdx
<Footnotes />
```

The placed list also takes settings for this one document:

```md
::footnotes{title="Sources" numbering="lower-roman"}
```

## Placement

`placement` decides where readers see the notes:

| Placement | What readers see                                                                              |
| --------- | --------------------------------------------------------------------------------------------- |
| `end`     | The numbered list where the document places it, or at the end. The default.                   |
| `side`    | Sidenotes in the margin, each beside the line that references it.                             |
| `popover` | The note in a native `popover`, anchored to the mark, when the reader activates it.           |
| `inline`  | The note opened under its line when the reader activates the mark, with a button to close it. |

`popover` and `inline` enhance the end list and never replace it, so the notes
still print and are still there without JavaScript. `side` replaces the list on
screen and keeps it in print. It falls back to `end` below `sideBreakpoint`
(1024px by default), when the margin is too narrow for the notes, or when the
stacked notes would run past the end of the article.

Side notes sit in the inline-end margin, `--postkit-sidenote-width` (232px)
wide and `--postkit-sidenote-gap` (48px) from the text, so leave that much room
beside your article column. Each note starts at its reference's line, and a
note that would overlap the one before moves down below it. They share the
margin with [Aside](/components/aside).

### Responsive placement

Pass one placement per breakpoint, smallest first. postkit.org uses this for
its notes: opened in place on phones, end notes from `md`, and sidenotes from
`xl`:

```ts
{ base: 'inline', md: 'end', xl: 'side' }
```

The breakpoint names are `base`, `sm`, `md`, `lg`, `xl` and `2xl`. With
`@postkit/chakra` they're your Chakra system's breakpoints. The headless
`Footnotes` uses Chakra UI's defaults (480, 768, 1024, 1280 and 1536px), or
the widths you pass in its `breakpoints` prop. In a directive, write the
object as JSON:

```md
::footnotes{placement='{"base":"inline","md":"end","xl":"side"}'}
```

## Set your site's footnotes

Set the defaults for every document in the Remark options, so the settings
are written into each document's references and list:

```ts
// lib/mdx.ts (build time)
import { postkitRemarkPlugins } from '@postkit/react/remark';
import { postkit } from './postkit';

export const remarkPlugins = postkitRemarkPlugins(postkit, {
  postkit: {
    footnotes: {
      defaults: {
        placement: { base: 'inline', md: 'end', xl: 'side' },
        variant: 'plain',
      },
    },
  },
});
```

Without `createPostkit`, pass the same `postkit` options to
`createPostkitRemarkPlugins`. `footnotes` also takes `scope`, the id prefix,
which defaults to the file's `data.slug` or front-matter `slug`, then its file
name. `footnotes: false` turns Postkit's handling off and leaves GFM's own
footnotes alone.

A document overrides the defaults with an authored `::footnotes{…}` or
`<Footnotes … />`, or with a `footnotes:` key in its front matter when your
pipeline puts the parsed front matter on `file.data.matter` or
`file.data.frontmatter`:

```yaml
footnotes:
  placement: side
```

You can also set `Footnotes` props in `createPostkit`'s
[`defaults`](/docs/defaults-and-slots). They apply when the page renders, and
each `Footnote` takes the shared settings (`marker`, `numbering`, `placement`,
`sideBreakpoint`) from them, so one setting styles both.

## Props

`Footnote` and `Footnotes` share these settings:

| Prop             | Values                                                    | Default       |
| ---------------- | --------------------------------------------------------- | ------------- |
| `placement`      | `end`, `side`, `popover`, `inline`, or one per breakpoint | `end`         |
| `marker`         | `superscript`, `bracket` (`[1]` on the baseline), `pill`  | `superscript` |
| `numbering`      | `decimal`, `lower-roman`, `lower-alpha`, `symbol`         | `decimal`     |
| `sideBreakpoint` | A width in px, below which `side` falls back to `end`     | `1024`        |
| `size`           | `sm`, `md`, `lg`                                          | `md`          |
| `variant`        | `outline`, `subtle`, `plain`                              | `subtle`      |

`symbol` numbering uses \*, †, ‡, §, ‖ and ¶, then doubles them. In React,
`numbering` also takes a function from the note's number to its mark.

`Footnotes` also takes:

| Prop        | Values                                                                                 | Default   |
| ----------- | -------------------------------------------------------------------------------------- | --------- |
| `title`     | The list heading. `false` hides it, and the list keeps "Notes" as its accessible name. | `"Notes"` |
| `backlinks` | Whether each note links back to its references.                                        | `true`    |

The Markdown tooling sets the rest (`identifier`, `index`, `occurrence`,
`references` and `scope`), so authors never write them.

## Validation

A reference with no note fails the build, in every mode, and points at the
reference:

```text
Footnote [^b] has no definition. (content/post.md:3:6-3:10)
```

A note nobody references is left out with a warning, and so is a second note
with the same id, or a second `::footnotes`. An invalid `placement`, `marker`
or `numbering` on `::footnotes` fails like any invalid prop. See
[Validation](/docs/validation#footnotes).

## Style them

The parts are `root` and `marker` for `Footnote`, and `root`, `title`, `rule`,
`list`, `item`, `number`, `content` and `backlink` for `Footnotes`. Style them
like any other component (see [Part styles](/docs/part-styles)).

With the headless renderer and `@postkit/react/styles.css`, these custom
properties retheme them:

| Custom property                                                     | Sets                               |
| ------------------------------------------------------------------- | ---------------------------------- |
| `--postkit-footnote-accent`                                         | The highlighted sidenote's rule    |
| `--postkit-footnote-marker-color`, `--postkit-footnote-marker-size` | The mark in the text               |
| `--postkit-footnote-number-color`, `--postkit-footnote-number-size` | The number beside each note        |
| `--postkit-footnote-text-color`, `--postkit-footnote-text-size`     | The notes' text                    |
| `--postkit-footnote-rule`, `--postkit-footnote-rule-width`          | The rule above the list            |
| `--postkit-footnote-target-bg`                                      | The note a reader just jumped to   |
| `--postkit-sidenote-width`, `--postkit-sidenote-gap`                | The margin column (232px and 48px) |

With `@postkit/chakra`, the sizes and the sidenote column read the same
custom properties, and the colours come from your system's semantic tokens.
Restyle them with `createPostkitTheme({ footnote, footnotes, sidenote })`,
like any recipe (see [Tokens](/docs/tokens)).

Every mark is a link to its note with `role="doc-noteref"` and a label such as
"Note 1", with a tap target of at least 24px. Activating a mark moves focus
to its note, a backlink returns it to the mark, and Escape closes a note opened
in place.

## In other renderers

| Renderer                      | Footnotes                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Headless and Chakra           | Every placement, with the shared behaviour (`useFootnotes` in `@postkit/react`).             |
| [Email](/docs/email)          | Always end notes: superscript numbers without links, and a numbered "Notes" list at the end. |
| Static HTML (`@postkit/core`) | The end list, with links and backlinks.                                                      |
| Plain text (`@postkit/core`)  | `[1]` marks, and a `[1] Note` list where the list is placed, or at the end.                  |

Email leaves out the links because in-message anchors are unreliable across
mail clients.
