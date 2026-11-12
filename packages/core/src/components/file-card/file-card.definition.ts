import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const fileCardDefinition = definePostkitComponent({
  name: 'FileCard',
  directive: 'postkit-file-card',
  category: 'technical-content',
  description: 'A descriptive file link or download.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    href: prop.string('The file URL.', { required: true }),
    name: prop.string('The displayed filename.', { required: true }),
    description: prop.string('Supporting file description.'),
    fileType: prop.string('The file format label.'),
    fileSize: prop.string('The human-readable size.'),
    download: prop.boolean('Whether the link requests a download.', {
      default: true,
    }),
    actionLabel: prop.string('The visible action text.'),
  },
  slots: postkitBuiltInSlots.FileCard,
  example: {
    props: { href: 'https://example.com/article', name: 'Ada Example' },
  },
});
