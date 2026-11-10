import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const codeGroupDefinition = definePostkitComponent({
  name: 'CodeGroup',
  directive: 'postkit-code-group',
  category: 'technical-content',
  description: 'A tabbed set of alternative code examples.',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of labeled code examples.', {
      required: true,
    }),
    label: prop.string('An accessible label for the code tabs.', {
      default: 'Code examples',
    }),
    initialIndex: prop.number('The initially selected code example.', {
      default: 0,
    }),
  },
  slots: ['root', 'tabs', 'tab', 'panel'],
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
