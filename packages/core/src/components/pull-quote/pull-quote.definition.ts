import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const pullQuoteDefinition = definePostkitComponent({
  name: 'PullQuote',
  directive: 'postkit-pull-quote',
  category: 'article-structure',
  description: 'A prominent quotation with optional attribution and citation.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    quote: prop.string('The quoted text.', { required: true }),
    attribution: prop.string('The quoted speaker or source.'),
    cite: prop.string('The cited work.'),
  },
  slots: ['root', 'mark', 'quote', 'attribution', 'cite'],
  example: {
    props: { quote: 'Portable content keeps its meaning.' },
  },
});
