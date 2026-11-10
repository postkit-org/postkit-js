import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const calloutDefinition = definePostkitComponent({
  name: 'Callout',
  directive: 'postkit-callout',
  category: 'article-structure',
  description: 'A highlighted note, tip, warning, or caution.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('An optional heading for the aside.'),
    tone: prop.enum(['note', 'tip', 'important', 'warning', 'caution'], {
      description: 'The semantic emphasis of the aside.',
      default: 'note',
      themeVariant: true,
    }),
  },
  slots: ['root', 'icon', 'content', 'title', 'body'],
  example: {
    children: 'Example content.',
  },
});
