import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const figureDefinition = definePostkitComponent({
  name: 'Figure',
  directive: 'postkit-figure',
  category: 'media',
  description: 'A responsive image with an optional caption and attribution.',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    src: prop.string('The image URL.', { required: true }),
    alt: prop.string(
      'Alternative text, or an explicitly empty value for a decorative image.',
      { required: true },
    ),
    caption: prop.string('Visible supporting text below the image.'),
    credit: prop.string('The image attribution or credit.'),
    creditHref: prop.string('A URL for the image attribution.'),
    href: prop.string('An optional destination when the image is activated.'),
    width: prop.number('The intrinsic image width in pixels.'),
    height: prop.number('The intrinsic image height in pixels.'),
    aspectRatio: prop.string('A CSS aspect ratio such as 16 / 9.'),
    objectFit: prop.enum(['contain', 'cover'], {
      description: 'How the image fits its media frame.',
      default: 'cover',
    }),
    objectPosition: prop.string('The focal position within the media frame.'),
    loading: prop.enum(['eager', 'lazy'], {
      description: 'Browser image loading behavior.',
      default: 'lazy',
    }),
    sizes: prop.string('Responsive image display-size hints.'),
    srcSet: prop.string('Responsive image source candidates.'),
    layout: prop.enum(['inline', 'wide', 'bleed'], {
      description: 'The figure width relative to article content.',
      default: 'inline',
      themeVariant: true,
    }),
  },
  slots: [
    'root',
    'mediaLink',
    'media',
    'image',
    'figcaption',
    'caption',
    'credit',
    'creditLink',
  ],
  example: {
    props: { src: '/media/example.jpg', alt: 'A descriptive example' },
  },
});
