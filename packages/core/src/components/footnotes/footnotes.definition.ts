import { definePostkitComponent } from '../definition.js';
import { postkitFootnoteSharedProps } from '../footnote/footnote.definition.js';
import { presentation, prop } from '../props.js';

export const footnotesDefinition = definePostkitComponent({
  name: 'Footnotes',
  directive: 'postkit-footnotes',
  category: 'article-structure',
  description:
    'The list of notes, each with a way back to its references. Closes the article unless placed.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.json<string | false>(
      'The list heading. Defaults to "Notes"; false hides it, and the list keeps "Notes" as its accessible name.',
      { default: 'Notes' },
    ),
    backlinks: prop.boolean(
      'Whether each note links back to its references (↩, then a, b, … for a shared note).',
      { default: true },
    ),
    ...postkitFootnoteSharedProps,
  },
  slots: [
    'root',
    'title',
    'rule',
    'list',
    'item',
    'number',
    'content',
    'backlink',
  ],
  keywords: ['footnotes', 'endnotes', 'notes', 'references', 'sidenotes'],
  example: {
    props: { title: 'Notes' },
  },
});
