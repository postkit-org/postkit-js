import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import {
  postkitFootnoteMarkers,
  postkitFootnoteNumberings,
  type PostkitFootnotePlacementValue,
} from './footnote.model.js';

/**
 * The props `Footnote` and `Footnotes` share. A reference without its own
 * value takes the site's `Footnotes` default, so one setting styles both.
 */
export const postkitFootnoteSharedProps = Object.freeze({
  marker: prop.enum(postkitFootnoteMarkers, {
    description:
      'How the reference is marked: a raised number (superscript, the default), [1] on the baseline (bracket), or a filled mark (pill).',
  }),
  numbering: prop.enum(postkitFootnoteNumberings, {
    description:
      'How notes are numbered: decimal (the default), lower-roman, lower-alpha or symbol (*, †, ‡…). React views also take a function.',
  }),
  placement: prop.json<PostkitFootnotePlacementValue>(
    'Where notes appear: end (the default), side, popover or inline, or one per breakpoint ({ "base": "inline", "md": "end", "xl": "side" }). Side falls back to end below sideBreakpoint or when the margin runs out; popover and inline enhance the end list and never replace it.',
  ),
  sideBreakpoint: prop.number(
    'The viewport width, in px, below which side notes fall back to the end list. Defaults to 1024.',
  ),
  scope: prop.string(
    'Prefixes the ids (fn-{scope}-1) so several documents on one page never collide; usually the slug. Set by the Markdown tooling.',
  ),
});

export const footnoteDefinition = definePostkitComponent({
  name: 'Footnote',
  directive: 'postkit-footnote',
  category: 'article-structure',
  description:
    'A reference mark in the text: a link to its note, numbered by order of first use.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    identifier: prop.string(
      'The note id from the source ([^id]). Set by the Markdown tooling.',
    ),
    index: prop.number(
      'The note number, by order of first reference. Set by the Markdown tooling.',
    ),
    occurrence: prop.number(
      'Which reference to the note this is, from 1. A shared note links back to each as a, b, …',
    ),
    references: prop.number(
      'How many references a note has, on a note inside Footnotes. Set by the Markdown tooling.',
    ),
    ...postkitFootnoteSharedProps,
  },
  slots: ['root', 'marker'],
  keywords: ['footnote', 'note', 'reference', 'citation', 'sidenote'],
  example: {
    props: { index: 1 },
    children: 'Markdown with directives, or MDX.',
  },
});
