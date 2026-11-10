import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const deviceDefinition = definePostkitComponent({
  name: 'Device',
  directive: 'postkit-device',
  category: 'media',
  description:
    'A screenshot in a plain iPhone, iPad or Mac frame drawn with CSS, with an optional caption.',
  runtime: 'static',
  stability: 'experimental',
  // Email gets core's static view: the image and caption, without the CSS frame.
  email: { fallback: 'text' },
  props: {
    ...presentation,
    kind: prop.enum(['iphone', 'ipad', 'mac'], {
      description:
        'The device frame: iphone (with a notch), ipad, or mac (a laptop with its base).',
      default: 'iphone',
      themeVariant: true,
    }),
    src: prop.string('The screenshot URL.', { required: true }),
    alt: prop.string(
      'Alternative text that describes what the screenshot shows.',
      { required: true },
    ),
    caption: prop.string('Visible supporting text below the device.'),
  },
  slots: [
    'root',
    'frame',
    'notch',
    'screen',
    'image',
    'base',
    'figcaption',
    'number',
    'caption',
  ],
  keywords: ['screenshot', 'mockup', 'iphone', 'ipad', 'mac', 'frame'],
  example: {
    props: {
      kind: 'iphone',
      src: '/media/screenshot.png',
      alt: 'The app’s home screen, listing three projects',
      caption: 'The companion app on iPhone.',
    },
  },
});
