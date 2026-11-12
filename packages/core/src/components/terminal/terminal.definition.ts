import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const terminalDefinition = definePostkitComponent({
  name: 'Terminal',
  directive: 'postkit-terminal',
  category: 'technical-content',
  description: 'A terminal command and its optional output.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    command: prop.string('The command text.', { required: true }),
    output: prop.string('The command output.'),
    prompt: prop.string('The shell prompt marker.', { default: '$' }),
    title: prop.string('The terminal window label.', { default: 'Terminal' }),
  },
  slots: postkitBuiltInSlots.Terminal,
  example: {
    props: { command: 'npm install @postkit/chakra' },
  },
});
