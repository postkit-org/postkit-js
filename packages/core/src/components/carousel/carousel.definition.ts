import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const carouselDefinition = definePostkitComponent({
  name: 'Carousel',
  directive: 'postkit-carousel',
  category: 'media',
  description: 'A keyboard-operable image and content carousel.',
  children: 'mdx',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    items: prop.json('A JSON array of carousel items.'),
    label: prop.string('The accessible name for the carousel.', {
      default: 'Article carousel',
    }),
    initialIndex: prop.number('The initially visible zero-based item index.'),
  },
  slots: [
    'root',
    'slide',
    'media',
    'content',
    'title',
    'description',
    'link',
    'controls',
    'previousTrigger',
    'status',
    'nextTrigger',
    'emptyState',
  ],
  example: {
    children: 'Example content.',
  },
});
