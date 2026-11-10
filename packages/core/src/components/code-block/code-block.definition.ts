import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const codeBlockDefinition = definePostkitComponent({
  name: 'CodeBlock',
  directive: 'postkit-code-block',
  category: 'technical-content',
  description:
    'Source code rendered with Chakra CodeBlock, with adapter-driven syntax highlighting, filenames, line numbers, copying, and wrapping.',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    code: prop.string('The literal source code.', { required: true }),
    language: prop.string('The syntax-language identifier.'),
    colorScheme: prop.enum(
      ['light', 'dark'],
      'The highlighting and semantic-token color scheme.',
    ),
    filename: prop.string('The displayed filename.'),
    highlightLines: prop.string('Comma-separated line numbers or ranges.'),
    lineNumbers: prop.boolean('Whether line numbers are displayed.', {
      default: false,
    }),
    copy: prop.boolean('Whether the copy action is displayed.', {
      default: true,
    }),
    wrap: prop.boolean('Whether long lines wrap.', { default: false }),
    maxHeight: prop.string('An optional maximum scrolling height.'),
  },
  slots: [
    'root',
    'header',
    'title',
    'filename',
    'language',
    'control',
    'actions',
    'copyTrigger',
    'button',
    'copyIndicator',
    'content',
    'scroller',
    'code',
    'codeText',
    'lineContent',
    'line',
    'lineNumber',
  ],
  example: {
    props: { code: "console.log('Hello, Postkit')" },
  },
});
