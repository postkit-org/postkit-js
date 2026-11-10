import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const newsletterSignupDefinition = definePostkitComponent({
  name: 'NewsletterSignup',
  directive: 'postkit-newsletter-signup',
  category: 'engagement',
  description:
    'A provider-agnostic newsletter form connected by PostkitProvider.',
  children: 'mdx',
  runtime: 'client',
  stability: 'initial',
  email: { fallback: 'omit' },
  props: {
    ...presentation,
    title: prop.string('The newsletter signup heading.', { required: true }),
    description: prop.string('Plain-text supporting copy.'),
    list: prop.string('A host-defined newsletter or audience identifier.'),
    emailLabel: prop.string('The accessible email field label.', {
      default: 'Email address',
    }),
    emailPlaceholder: prop.string('The email field placeholder.'),
    buttonLabel: prop.string('The submit button label.', {
      default: 'Subscribe',
    }),
    privacy: prop.string('A short privacy or consent note.'),
    successMessage: prop.string('The default successful-submission message.', {
      default: 'Thanks for subscribing.',
    }),
    errorMessage: prop.string('The default failed-submission message.', {
      default: 'Subscription failed. Please try again.',
    }),
    alignment: prop.enum(['start', 'center'], {
      description: 'The content and form alignment.',
      default: 'start',
      themeVariant: true,
    }),
  },
  slots: [
    'root',
    'content',
    'title',
    'description',
    'form',
    'label',
    'fields',
    'input',
    'submit',
    'status',
    'privacy',
  ],
  example: {
    props: { title: 'newsletter signup example' },
    children: 'Example content.',
  },
});
