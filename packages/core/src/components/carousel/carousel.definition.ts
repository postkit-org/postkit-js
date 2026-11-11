import { definePostkitComponent } from '../definition.js';
import { headingLevelProp } from '../heading-level.js';
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
    headingLevel: headingLevelProp(
      "Renders each item title as a heading at this level. Leave it unset and item titles are paragraphs, so the carousel never breaks the page's heading outline.",
    ),
    label: prop.string('The accessible name for the carousel.', {
      default: 'Article carousel',
    }),
    initialIndex: prop.number('The initially visible zero-based item index.'),
    presentation: prop.enum(['slides', 'peek'], {
      description:
        'slides shows one item with a position status; peek centres the current item with its neighbours in view, arrows only, and announces its caption. Neither advances on its own.',
      default: 'slides',
      themeVariant: true,
    }),
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
    'caption',
    'number',
  ],
  example: {
    children: 'Example content.',
  },
});
