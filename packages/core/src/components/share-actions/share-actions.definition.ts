import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const shareActionsDefinition = definePostkitComponent({
  name: 'ShareActions',
  directive: 'postkit-share-actions',
  category: 'engagement',
  description:
    'Reader-initiated native, copy, email, and configured social sharing actions.',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'omit' },
  props: {
    ...presentation,
    url: prop.string('The canonical URL to share.', { required: true }),
    title: prop.string('The title included with the share.'),
    text: prop.string('Supporting text included with the share.'),
    services: prop.json('A JSON array of configured service identifiers.'),
    label: prop.string('The accessible heading for the actions.', {
      default: 'Share this post',
    }),
    layout: prop.enum(['inline', 'buttons'], {
      description: 'How share actions are arranged.',
      default: 'buttons',
      themeVariant: true,
    }),
  },
  slots: postkitBuiltInSlots.ShareActions,
  example: {
    props: { url: 'https://example.com/article' },
  },
});
