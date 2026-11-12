import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const stepsDefinition = definePostkitComponent({
  name: 'Steps',
  directive: 'postkit-steps',
  category: 'article-structure',
  description: 'An ordered sequence of titled instructions.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    items: prop.json('A JSON array of step titles and descriptions.', {
      required: true,
    }),
  },
  slots: postkitBuiltInSlots.Steps,
  example: {
    props: { items: [{ title: 'First step', description: 'Start here.' }] },
  },
});
