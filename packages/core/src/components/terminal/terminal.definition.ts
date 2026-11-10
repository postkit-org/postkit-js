import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const terminalDefinition = definePostkitComponent({
  name: 'Terminal',
  directive: 'postkit-terminal',
  category: 'technical-content',
  description: 'A terminal command and its optional output.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    command: prop.string('The command text.', { required: true }),
    output: prop.string('The command output.'),
    prompt: prop.string('The shell prompt marker.', { default: '$' }),
    title: prop.string('The terminal window label.', { default: 'Terminal' }),
  },
  slots: [
    'root',
    'header',
    'dots',
    'title',
    'body',
    'prompt',
    'command',
    'output',
  ],
  example: {
    props: { command: 'npm install @postkit/chakra' },
  },
});
