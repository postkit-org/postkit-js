import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const asideDefinition = definePostkitComponent({
  name: 'Aside',
  directive: 'postkit-aside',
  category: 'article-structure',
  description: 'A semantic article aside with optional emphasis.',
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
  // The Callout anatomy without `icon`: Aside has no tone mark (D14).
  slots: ['root', 'content', 'title', 'body'],
  example: {
    children: 'Example content.',
  },
});
