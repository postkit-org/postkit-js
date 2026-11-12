import { definePostkitComponent } from '../definition.js';
import { headingLevelProp } from '../heading-level.js';
import { presentation, prop } from '../props.js';
import { postkitBuiltInSlots } from '../slots.js';

export const linkPreviewDefinition = definePostkitComponent({
  name: 'LinkPreview',
  directive: 'postkit-link-preview',
  category: 'discovery',
  description:
    'A portable inline link, metadata card, native media player, or isolated rich embed.',
  runtime: 'resolver',
  stability: 'initial',
  props: {
    ...presentation,
    href: prop.string('The destination URL.', { required: true }),
    presentation: prop.enum(['inline', 'card', 'embed', 'media', 'auto'], {
      description:
        'The requested link treatment. Auto chooses from resolved metadata.',
      default: 'card',
      themeVariant: true,
    }),
    images: prop.enum(['none', 'first', 'carousel'], {
      description: 'How resolved preview images are displayed.',
      default: 'first',
    }),
    media: prop.enum(
      ['auto', 'audio', 'video'],
      'The preferred native media type.',
    ),
    activation: prop.enum(['click', 'immediate'], {
      description:
        'Whether an external interactive embed waits for reader consent.',
      default: 'click',
    }),
    provider: prop.string(
      'A provider override for PostkitProvider, an editor, or a build-time resolver integration.',
    ),
    metadata: prop.json(
      'A normalized @postkit/unfurl result serialized as JSON.',
    ),
    title: prop.string('An author-supplied title override.'),
    headingLevel: headingLevelProp(
      "Renders the card title as a heading at this level. Leave it unset and the title is a paragraph, so the preview never breaks the page's heading outline.",
    ),
    description: prop.string('An author-supplied description override.'),
    siteName: prop.string('An author-supplied site-name override.'),
    image: prop.string('An author-supplied primary image override.'),
    imageAlt: prop.string('Alternative text for the primary image override.'),
    favicon: prop.string('An author-supplied site icon override.'),
    iframeTitle: prop.string(
      'An accessible title for a resolved iframe embed.',
    ),
  },
  slots: postkitBuiltInSlots.LinkPreview,
  example: {
    props: { href: 'https://example.com/article' },
  },
});
