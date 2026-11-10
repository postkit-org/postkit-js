import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const cardGridDefinition = definePostkitComponent({
  name: 'CardGrid',
  directive: 'postkit-card-grid',
  category: 'article-structure',
  description: 'A deterministic grid of related navigation cards.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    items: prop.json('A JSON array of titled cards.', { required: true }),
    title: prop.string('The grid heading.'),
    description: prop.string('Supporting copy for the grid.'),
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
    'card',
    'image',
    'cardBody',
    'cardTitle',
    'cardDescription',
    'meta',
    'link',
  ],
  example: {
    props: { items: [{ title: 'Example item' }] },
  },
});
