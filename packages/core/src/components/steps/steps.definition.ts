import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

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
  slots: ['root', 'item', 'marker', 'content', 'title', 'description'],
  example: {
    props: { items: [{ title: 'First step', description: 'Start here.' }] },
  },
});
