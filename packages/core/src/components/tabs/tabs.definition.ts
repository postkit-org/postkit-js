import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const tabsDefinition = definePostkitComponent({
  name: 'Tabs',
  directive: 'postkit-tabs',
  category: 'article-structure',
  description: 'Keyboard-operable switchable article panels.',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of tab labels and content.', {
      required: true,
    }),
    label: prop.string('An accessible label for the tab list.', {
      default: 'Tabbed content',
    }),
    initialIndex: prop.number('The initially selected tab index.', {
      default: 0,
    }),
  },
  slots: postkitBuiltInSlots.Tabs,
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
