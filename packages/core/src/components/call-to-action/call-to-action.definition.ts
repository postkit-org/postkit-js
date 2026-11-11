import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const callToActionDefinition = definePostkitComponent({
  name: 'CallToAction',
  directive: 'postkit-call-to-action',
  category: 'engagement',
  description: 'A focused article callout with primary and secondary actions.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('The call-to-action heading.', { required: true }),
    eyebrow: prop.string('A short label displayed above the heading.'),
    description: prop.string('Plain-text supporting copy.'),
    primaryLabel: prop.string('The primary action label.'),
    primaryHref: prop.string('The primary action destination.'),
    secondaryLabel: prop.string('The secondary action label.'),
    secondaryHref: prop.string('The secondary action destination.'),
    alignment: prop.enum(['start', 'center'], {
      description: 'The content and action alignment.',
      default: 'start',
      themeVariant: true,
    }),
  },
  slots: postkitBuiltInSlots.CallToAction,
  example: {
    props: { title: 'call to action example' },
    children: 'Example content.',
  },
});
