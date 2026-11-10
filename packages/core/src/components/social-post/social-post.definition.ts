import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const socialPostDefinition = definePostkitComponent({
  name: 'SocialPost',
  directive: 'postkit-social-post',
  category: 'discovery',
  description:
    'A consistently styled social post card or consent-gated provider embed.',
  runtime: 'resolver',
  stability: 'experimental',
  props: {
    ...presentation,
    href: prop.string('The original social post URL.', { required: true }),
    provider: prop.string('The metadata resolver override.'),
    resolution: prop.enum(
      ['live', 'snapshot', 'snapshot-fallback'],
      'Whether Postkit resolves the current post, renders frozen metadata, or falls back to live resolution when no snapshot exists.',
    ),
    snapshotInfo: prop.enum(['auto', 'visible', 'hidden'], {
      description:
        'Whether snapshot capture provenance is displayed in the rendered card.',
      default: 'auto',
    }),
    service: prop.string('The social service branding identifier.'),
    presentation: prop.enum(['card', 'embed', 'auto'], {
      description: 'The native-card or provider-embed treatment.',
      default: 'auto',
      themeVariant: true,
    }),
    branding: prop.enum(['none', 'subtle', 'full'], {
      description: 'How strongly the service identity is displayed.',
      default: 'subtle',
      themeVariant: true,
    }),
    activation: prop.enum(['click', 'immediate'], {
      description: 'Whether an interactive embed waits for consent.',
      default: 'click',
    }),
    metadata: prop.json(
      'A normalized social post, unfurl result, or versioned Postkit snapshot envelope.',
    ),
    authorName: prop.string('An author-supplied display-name override.'),
    authorHandle: prop.string('An author-supplied social handle override.'),
    authorAvatar: prop.string('An author-supplied avatar URL override.'),
    text: prop.string('An author-supplied post-text override.'),
    publishedAt: prop.string('An ISO publication timestamp override.'),
    showMetrics: prop.boolean(
      'Whether available engagement counts are shown.',
      { default: false },
    ),
    iframeTitle: prop.string('An accessible title for a provider iframe.'),
  },
  slots: [
    'root',
    'serviceRow',
    'serviceBadge',
    'serviceIcon',
    'authorRow',
    'avatar',
    'author',
    'authorName',
    'handle',
    'timestamp',
    'content',
    'media',
    'image',
    'metrics',
    'metric',
    'quote',
    'quoteAuthor',
    'quoteContent',
    'footer',
    'originalLink',
    'snapshotInfo',
    'snapshotLabel',
    'snapshotTime',
    'embedFrame',
    'embed',
    'consent',
    'consentButton',
  ],
  example: {
    props: { href: 'https://example.com/article' },
  },
});
