import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const relatedContentDefinition = definePostkitComponent({
  name: 'RelatedContent',
  directive: 'postkit-related-content',
  category: 'discovery',
  description: 'A semantic list of related articles or resources.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of related content links.', {
      required: true,
    }),
    title: prop.string('The related-content heading.', {
      default: 'Related content',
    }),
  },
  slots: postkitBuiltInSlots.RelatedContent,
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
