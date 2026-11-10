import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const fileTreeDefinition = definePostkitComponent({
  name: 'FileTree',
  directive: 'postkit-file-tree',
  category: 'technical-content',
  description: 'A compact, semantic repository or project tree.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of paths, types, and optional metadata.', {
      required: true,
    }),
    title: prop.string('The tree heading.'),
  },
  slots: ['root', 'title', 'list', 'item', 'icon', 'path', 'meta'],
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
