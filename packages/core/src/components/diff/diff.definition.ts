import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const diffDefinition = definePostkitComponent({
  name: 'Diff',
  directive: 'postkit-diff',
  category: 'technical-content',
  description: 'A semantic unified diff with additions and deletions.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    diff: prop.string('Unified diff text.', { required: true }),
    title: prop.string('The displayed diff filename.'),
  },
  slots: postkitBuiltInSlots.Diff,
  example: {
    props: { diff: '- before\n+ after' },
  },
});
