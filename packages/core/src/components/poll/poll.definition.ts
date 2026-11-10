import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const pollDefinition = definePostkitComponent({
  name: 'Poll',
  directive: 'postkit-poll',
  category: 'engagement',
  description:
    'An interactive reader poll whose submission handler is host-owned.',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'link' },
  props: {
    ...presentation,
    question: prop.string('The poll question.', { required: true }),
    description: prop.string('Supporting poll copy.'),
    options: prop.json('A JSON array of stable option IDs and labels.', {
      required: true,
    }),
    totalVotes: prop.number('An optional total vote count.'),
    selectedId: prop.string('An optional initially selected option.'),
  },
  slots: [
    'root',
    'question',
    'description',
    'options',
    'option',
    'optionLabel',
    'result',
    'bar',
    'status',
  ],
  example: {
    props: {
      question: 'What do you think?',
      options: [{ id: 'yes', label: 'Yes' }],
    },
  },
});
