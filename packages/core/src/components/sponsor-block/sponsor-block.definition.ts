import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const sponsorBlockDefinition = definePostkitComponent({
  name: 'SponsorBlock',
  directive: 'postkit-sponsor-block',
  category: 'publishing',
  description: 'A clearly disclosed sponsor message and destination.',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    name: prop.string('The sponsor name.', { required: true }),
    message: prop.string('The sponsor message.'),
    href: prop.string('The sponsor destination.'),
    actionLabel: prop.string('The sponsor action label.', {
      default: 'Learn more',
    }),
    logoSrc: prop.string('The sponsor logo URL.'),
    logoAlt: prop.string('Alternative text for the sponsor logo.'),
    disclosure: prop.string('The commercial disclosure label.', {
      default: 'Sponsored',
    }),
  },
  slots: postkitBuiltInSlots.SponsorBlock,
  example: {
    props: { name: 'Ada Example' },
  },
});
