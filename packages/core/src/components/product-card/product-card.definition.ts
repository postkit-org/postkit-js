import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const productCardDefinition = definePostkitComponent({
  name: 'ProductCard',
  directive: 'postkit-product-card',
  category: 'publishing',
  description:
    'A product or recommendation card with explicit commercial linking.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('The product name.', { required: true }),
    href: prop.string('The product destination.', { required: true }),
    description: prop.string('The product summary.'),
    actionLabel: prop.string('The product action label.', {
      default: 'View product',
    }),
    imageSrc: prop.string('The product image URL.'),
    imageAlt: prop.string('Alternative text for the product image.'),
    price: prop.string('The displayed price.'),
    rating: prop.number('A five-point rating.'),
    badge: prop.string('A short product badge.'),
    rel: prop.string('The link relationship, normally sponsored.', {
      default: 'sponsored',
    }),
  },
  slots: postkitBuiltInSlots.ProductCard,
  example: {
    props: {
      title: 'product card example',
      href: 'https://example.com/article',
    },
  },
});
