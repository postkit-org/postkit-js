import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const galleryDefinition = definePostkitComponent({
  name: 'Gallery',
  directive: 'postkit-gallery',
  category: 'media',
  description: 'A responsive image gallery with captions and links.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    items: prop.json('A JSON array of image, alt, caption, and link data.', {
      required: true,
    }),
    title: prop.string('The gallery heading.'),
    description: prop.string('Supporting copy for the gallery.'),
    columns: prop.enum(['1', '2', '3', '4'], {
      description: 'The preferred desktop column count.',
      default: '2',
    }),
  },
  slots: [
    'root',
    'header',
    'title',
    'description',
    'grid',
    'item',
    'imageLink',
    'image',
    'caption',
  ],
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
