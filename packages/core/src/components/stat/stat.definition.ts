import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const statDefinition = definePostkitComponent({
  name: 'Stat',
  directive: 'postkit-stat',
  category: 'technical-content',
  description: 'A prominent metric with context and trend.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    value: prop.string('The displayed metric value.', { required: true }),
    label: prop.string('The metric label.', { required: true }),
    trend: prop.string('The metric trend.'),
    description: prop.string('Supporting metric context.'),
  },
  slots: ['root', 'value', 'label', 'trend', 'description'],
  example: {
    props: { value: '42%', label: 'Example' },
  },
});
