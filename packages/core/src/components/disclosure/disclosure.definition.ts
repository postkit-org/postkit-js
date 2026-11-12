import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const disclosureDefinition = definePostkitComponent({
  name: 'Disclosure',
  directive: 'postkit-disclosure',
  category: 'article-structure',
  description: 'Native expandable content for details and FAQs.',
  children: 'mdx',
  runtime: 'native-controls',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    summary: prop.string('The always-visible disclosure label.', {
      required: true,
    }),
    open: prop.boolean('Whether the disclosure starts expanded.', {
      default: false,
    }),
  },
  slots: postkitBuiltInSlots.Disclosure,
  example: {
    props: { summary: 'Example' },
    children: 'Example content.',
  },
});
