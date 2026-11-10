import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const comparisonDefinition = definePostkitComponent({
  name: 'Comparison',
  directive: 'postkit-comparison',
  category: 'technical-content',
  description: 'An accessible feature and option comparison table.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    columns: prop.json('A JSON array of compared option labels.', {
      required: true,
    }),
    items: prop.json('A JSON array of feature rows and values.', {
      required: true,
    }),
    title: prop.string('The comparison heading.'),
    description: prop.string('Supporting comparison copy.'),
  },
  slots: [
    'root',
    'title',
    'description',
    'scroller',
    'table',
    'head',
    'header',
    'row',
    'label',
    'value',
  ],
  example: {
    props: {
      columns: ['Starter', 'Pro'],
      items: [{ label: 'Portable content', values: [true, true] }],
    },
  },
});
