import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const disclosureDefinition = definePostkitComponent({
  name: 'Disclosure',
  directive: 'postkit-disclosure',
  category: 'article-structure',
  description: 'Native expandable content for details and FAQs.',
  children: 'mdx',
  runtime: 'native-controls',
  stability: 'initial',
  props: {
    ...presentation,
    summary: prop.string('The always-visible disclosure label.', {
      required: true,
    }),
    open: prop.boolean('Whether the disclosure starts expanded.', {
      default: false,
    }),
  },
  slots: ['root', 'summary', 'indicator', 'content'],
  example: {
    props: { summary: 'Example' },
    children: 'Example content.',
  },
});
