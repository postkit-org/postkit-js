import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const keyTakeawayDefinition = definePostkitComponent({
  name: 'KeyTakeaway',
  directive: 'postkit-key-takeaway',
  category: 'article-structure',
  description: 'A highlighted summary or list of essential points.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('The takeaway heading.', { default: 'Key takeaway' }),
    eyebrow: prop.string('A short label above the heading.'),
    items: prop.json('A JSON array of takeaway bullets.'),
  },
  slots: postkitBuiltInSlots.KeyTakeaway,
  example: {
    children: 'Example content.',
  },
});
