import {
  AppearsOn,
  Aside,
  Audio,
  AudienceBoundary,
  AuthorCard,
  Callout,
  CallToAction,
  CardGrid,
  Carousel,
  Chart,
  CodeBlock,
  CodeGroup,
  Comparison,
  Diff,
  Disclosure,
  Figure,
  FileCard,
  FileTree,
  Gallery,
  KeyTakeaway,
  LinkPreview,
  NewsletterSignup,
  Poll,
  ProductCard,
  PullQuote,
  RelatedContent,
  SeriesNavigation,
  ShareActions,
  SocialPost,
  SponsorBlock,
  Stat,
  Steps,
  Tabs,
  Terminal,
  Video,
  type PostkitComponentName,
} from '@postkit/chakra';
import type { ComponentType, ReactNode } from 'react';

/** A prop value in a sample: what an author can write in MDX or a directive attribute. */
export type PreviewPropValue =
  | string
  | number
  | boolean
  | readonly unknown[]
  | { readonly [key: string]: unknown };

export type PreviewProps = Readonly<Record<string, PreviewPropValue>>;

/**
 * The content a component is previewed with. The same data renders the live preview and
 * writes the Usage source, so the code always matches what's on screen.
 */
export interface PreviewSample {
  /** Authored props (no `tone`, `variant` or `size` unless the sample fixes one). */
  readonly props: PreviewProps;
  /** The body, for components that take one (`childMode: mdx`). Plain text or Markdown. */
  readonly children?: string;
  /**
   * The Markdown form, where the boards write it differently from the MDX one (a list body
   * instead of a JSON attribute, a one-line command instead of a multi-line file).
   */
  readonly markdown?: {
    readonly props: PreviewProps;
    readonly children?: string;
  };
}

const previewImage = '/component-preview.svg';
const previewHref = '#component-preview';
const silentAudio =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const posterOnlyVideo = 'data:video/mp4;base64,';

/**
 * One sample per catalog component. The four designed components (Callout, KeyTakeaway,
 * CodeBlock, Figure) use their boards' content; typed against the component union, so a
 * new component fails the build until it has a sample.
 */
export const componentPreviewSamples: Readonly<
  Record<PostkitComponentName, PreviewSample>
> = {
  AppearsOn: {
    props: {
      label: 'Read this story on',
      showDates: true,
      items: [
        {
          service: 'bluesky',
          url: previewHref,
          label: 'Bluesky',
          publishedAt: '2026-08-28T14:00:00Z',
          status: 'published',
        },
        {
          service: 'mastodon',
          url: previewHref,
          label: 'Mastodon',
          publishedAt: '2026-08-28T14:05:00Z',
          status: 'published',
        },
      ],
    },
  },
  AudienceBoundary: {
    props: { audience: 'Postkit members', showLabel: true },
    children: 'This section is available to the intended audience.',
  },
  Aside: {
    props: { title: 'A note from the editor', tone: 'note' },
    children:
      'Use an aside for context that supports the article without interrupting its main thread.',
  },
  Audio: {
    props: {
      src: silentAudio,
      title: 'The portable publishing briefing',
      caption: 'Episode 12 · 18 minutes',
    },
  },
  AuthorCard: {
    props: {
      name: 'Ada Hart',
      role: 'Independent publisher',
      avatarSrc: previewImage,
      bio: 'Writing about durable content systems and the open web.',
      links: [
        { label: 'Articles', href: previewHref },
        { label: 'Profile', href: previewHref },
      ],
    },
  },
  Callout: {
    props: { tone: 'tip', title: 'Keep the content' },
    children: 'Change the renderer without changing the article.',
  },
  CallToAction: {
    props: {
      eyebrow: 'Ready to publish?',
      title: 'Build a portable article system',
      description:
        'Start with the React package and add framework adapters only when you need them.',
      primaryLabel: 'Get started',
      primaryHref: previewHref,
      secondaryLabel: 'Read the guide',
      secondaryHref: previewHref,
    },
  },
  CardGrid: {
    props: {
      title: 'Explore Postkit',
      description: 'Choose the path that matches your publishing workflow.',
      columns: '3',
      items: [
        {
          title: 'Author content',
          description: 'Markdown, MDX, and portable documents.',
          href: previewHref,
        },
        {
          title: 'Compose a theme',
          description: 'Inherit from Chakra and override by recipe.',
          href: previewHref,
        },
        {
          title: 'Ship anywhere',
          description: 'Use the adapter for your preferred framework.',
          href: previewHref,
        },
      ],
    },
  },
  Carousel: {
    props: {
      label: 'Featured stories',
      items: [
        {
          id: 'one',
          image: { src: previewImage, alt: 'Abstract editorial artwork' },
          title: 'A component vocabulary for articles',
          description: 'Rich stories, represented as portable content.',
        },
        {
          id: 'two',
          image: { src: previewImage, alt: 'Abstract editorial artwork' },
          title: 'Themes that belong to the host',
          description: 'Use Chakra recipes without fighting library CSS.',
        },
      ],
    },
  },
  Chart: {
    props: {
      title: 'Readers by channel',
      description: 'Monthly audience growth across owned channels.',
      data: [
        { label: 'June', newsletter: 28, web: 52 },
        { label: 'July', newsletter: 41, web: 68 },
        { label: 'August', newsletter: 57, web: 83 },
      ],
      series: [
        { key: 'newsletter', label: 'Newsletter' },
        { key: 'web', label: 'Web' },
      ],
    },
  },
  CodeBlock: {
    props: {
      filename: 'lib/postkit.ts',
      language: 'ts',
      lineNumbers: true,
      highlightLines: '4',
      code: "import { createPostkit } from '@postkit/react'\nimport { article, technical } from '@postkit/react/kits'\n\nexport const postkit = createPostkit({\n  kits: [article, technical],\n})",
    },
    markdown: {
      props: {
        language: 'sh',
        code: 'npm install @postkit/react',
        copy: true,
      },
    },
  },
  CodeGroup: {
    props: {
      label: 'Install Postkit',
      items: [
        {
          label: 'npm',
          code: 'npm install @postkit/chakra',
          language: 'shell',
        },
        { label: 'pnpm', code: 'pnpm add @postkit/chakra', language: 'shell' },
      ],
    },
  },
  Comparison: {
    props: {
      title: 'Choose a rendering model',
      columns: ['Static HTML', 'Interactive React'],
      items: [
        { label: 'Portable document', values: [true, true] },
        { label: 'Client JavaScript', values: ['None', 'As needed'] },
        { label: 'Interactive controls', values: [false, true] },
      ],
    },
  },
  Diff: {
    props: {
      title: 'theme.ts',
      diff: "- fontWeight: 'bold'\n+ fontWeight: 'inherit'\n  color: 'fg'",
    },
  },
  Disclosure: {
    props: { summary: 'What makes Postkit portable?', open: true },
    children:
      'Its authored component contract is independent from the framework adapter and presentation layer.',
  },
  Figure: {
    props: {
      src: previewImage,
      alt: 'Abstract Postkit editorial artwork',
      caption: 'A portable story can retain its meaning across renderers.',
      credit: 'Postkit',
      aspectRatio: '16 / 9',
    },
  },
  FileCard: {
    props: {
      href: previewHref,
      name: 'postkit-content-model.pdf',
      description: 'The portable document and component contract.',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      download: true,
    },
  },
  FileTree: {
    props: {
      title: 'Publishing project',
      items: [
        { path: 'content', type: 'folder' },
        { path: 'content/articles', type: 'folder' },
        { path: 'content/articles/hello.mdx', type: 'file', meta: '2 KB' },
        { path: 'postkit.config.ts', type: 'file' },
      ],
    },
  },
  Gallery: {
    props: {
      title: 'From the field',
      description: 'A responsive collection of article media.',
      columns: '3',
      items: [
        {
          src: previewImage,
          alt: 'Abstract editorial artwork',
          caption: 'Dispatch one',
        },
        {
          src: previewImage,
          alt: 'Abstract editorial artwork',
          caption: 'Dispatch two',
        },
        {
          src: previewImage,
          alt: 'Abstract editorial artwork',
          caption: 'Dispatch three',
        },
      ],
    },
  },
  KeyTakeaway: {
    props: {
      eyebrow: 'In short',
      title: 'What ships in 0.3',
      items: [
        'Definitions outside any framework',
        'Headless React views',
        'Chakra as its own package',
      ],
    },
    markdown: {
      props: { eyebrow: 'In short', title: 'What ships in 0.3' },
      children:
        '- Definitions outside any framework\n- Headless React views\n- Chakra as its own package',
    },
  },
  LinkPreview: {
    props: {
      href: previewHref,
      title: 'Designing content that travels well',
      description:
        'A field guide to portable semantics, host-owned themes, and renderer boundaries.',
      siteName: 'Postkit Journal',
      image: previewImage,
      imageAlt: 'Abstract Postkit editorial artwork',
    },
  },
  NewsletterSignup: {
    props: {
      title: 'The portable publishing letter',
      description: 'Occasional notes on content systems and the open web.',
      emailPlaceholder: 'reader@example.com',
      buttonLabel: 'Join the list',
      privacy: 'No tracking pixels. Unsubscribe whenever you like.',
    },
  },
  Poll: {
    props: {
      question: 'Where do you publish most often?',
      description: "Select one channel to see the component's feedback state.",
      options: [
        { id: 'site', label: 'My own site', votes: 42 },
        { id: 'newsletter', label: 'A newsletter', votes: 31 },
        { id: 'social', label: 'Social platforms', votes: 18 },
      ],
    },
  },
  ProductCard: {
    props: {
      title: "The Independent Publisher's Field Notes",
      description: 'A compact notebook for planning durable stories.',
      href: previewHref,
      imageSrc: previewImage,
      imageAlt: 'Abstract cover artwork',
      price: '$18',
      rating: 4.5,
      badge: "Editor's pick",
    },
  },
  PullQuote: {
    props: {
      quote:
        'The best publishing systems preserve meaning while letting presentation evolve.',
      attribution: 'Ada Hart',
      cite: 'The Portable Web',
    },
  },
  RelatedContent: {
    props: {
      title: 'Continue reading',
      items: [
        {
          title: 'Authoring with portable directives',
          description: 'Add rich semantics without coupling content to React.',
          meta: '7 min read',
          href: previewHref,
        },
        {
          title: 'Composing a host-owned theme',
          description: 'Layer Postkit recipes into an existing Chakra system.',
          meta: '5 min read',
          href: previewHref,
        },
      ],
    },
  },
  SeriesNavigation: {
    props: {
      title: 'Portable publishing foundations',
      current: 2,
      total: 4,
      previous: { title: 'The content contract', href: previewHref },
      next: { title: 'Framework adapters', href: previewHref },
    },
  },
  ShareActions: {
    props: {
      url: 'https://postkit.org/components',
      title: 'Postkit component library',
      text: 'Publishing components that travel well.',
      services: ['copy', 'email'],
      label: 'Share this guide',
    },
  },
  SocialPost: {
    props: {
      href: previewHref,
      service: 'bluesky',
      authorName: 'Postkit',
      authorHandle: '@postkit.org',
      authorAvatar: previewImage,
      text: 'A portable component contract lets the same story feel at home in every renderer.',
      publishedAt: '2026-08-28T14:00:00Z',
    },
  },
  SponsorBlock: {
    props: {
      name: 'Open Web Fund',
      message: 'Supporting independent tools for durable, portable publishing.',
      href: previewHref,
      actionLabel: 'Meet the sponsor',
      logoSrc: previewImage,
      logoAlt: 'Open Web Fund',
    },
  },
  Stat: {
    props: {
      value: '84%',
      label: 'Content reused across channels',
      trend: '↑ 12% this quarter',
      description: 'Across web, email, and syndication feeds.',
    },
  },
  Steps: {
    props: {
      items: [
        { title: 'Install', description: 'Add the React package.' },
        {
          title: 'Provide',
          description: 'Connect Postkit to your Chakra system.',
        },
        {
          title: 'Publish',
          description: 'Render the same content wherever it belongs.',
        },
      ],
    },
  },
  Tabs: {
    props: {
      label: 'Rendering approaches',
      items: [
        { label: 'MDX', content: 'Map authored tags to Postkit components.' },
        {
          label: 'Markdown',
          content: 'Use portable directives for rich content.',
        },
        { label: 'JSON', content: 'Render a structured portable document.' },
      ],
    },
  },
  Terminal: {
    props: {
      title: 'Terminal',
      prompt: '$',
      command: 'npm install @postkit/chakra',
      output: 'added 1 package in 842ms',
    },
  },
  Video: {
    props: {
      src: posterOnlyVideo,
      poster: previewImage,
      title: 'Postkit in two minutes',
      caption: 'A quick tour of the portable publishing contract.',
    },
  },
};

type PreviewView = ComponentType<
  Record<string, unknown> & { readonly children?: ReactNode }
>;

// The real `@postkit/chakra` components (01 §1 dogfood): the site never draws its own.
const views = {
  AppearsOn,
  AudienceBoundary,
  Aside,
  Audio,
  AuthorCard,
  Callout,
  CallToAction,
  CardGrid,
  Carousel,
  Chart,
  CodeBlock,
  CodeGroup,
  Comparison,
  Diff,
  Disclosure,
  Figure,
  FileCard,
  FileTree,
  Gallery,
  KeyTakeaway,
  LinkPreview,
  NewsletterSignup,
  Poll,
  ProductCard,
  PullQuote,
  RelatedContent,
  SeriesNavigation,
  ShareActions,
  SocialPost,
  SponsorBlock,
  Stat,
  Steps,
  Tabs,
  Terminal,
  Video,
} as unknown as Readonly<Record<PostkitComponentName, PreviewView>>;

export interface ComponentPreviewProps {
  readonly name: PostkitComponentName;
  /**
   * Theme-variant values from the preview controls (`tone`, `variant`, `size`), applied
   * over the sample's props.
   */
  readonly values?: Readonly<Record<string, string | undefined>>;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'outline' | 'subtle' | 'plain';
}

/** The sample's props with the controls' values applied: what the preview renders. */
export function resolvePreviewProps(
  name: PostkitComponentName,
  values: Readonly<Record<string, string | undefined>> = {},
): PreviewProps {
  const resolved: Record<string, PreviewPropValue> = {
    ...componentPreviewSamples[name].props,
  };
  for (const [prop, value] of Object.entries(values)) {
    if (value !== undefined) resolved[prop] = value;
  }
  return resolved;
}

/** A live preview of one catalog component, rendered by `@postkit/chakra`. */
export function ComponentPreview({
  name,
  values,
  size,
  variant,
}: ComponentPreviewProps) {
  const View = views[name];
  const sample = componentPreviewSamples[name];
  const props = resolvePreviewProps(name, { size, variant, ...values });

  return <View {...props}>{sample.children}</View>;
}
