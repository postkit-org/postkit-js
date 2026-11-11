import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

/**
 * @internal The note beside its reference, rendered by `Footnote` for the
 * `side`, `popover` and `inline` placements and never authored. It shares
 * the margin column with `Aside` (D14). It isn't a built-in: it has no
 * directive registration, kit or manifest entry.
 */
export const sidenoteDefinition = definePostkitComponent({
  name: 'Sidenote',
  directive: 'postkit-sidenote',
  category: 'article-structure',
  description: 'A footnote shown beside its reference (internal).',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    index: prop.number('The note number.'),
  },
  slots: ['root', 'number', 'content'],
});
