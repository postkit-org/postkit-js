import { Box } from '@chakra-ui/react';
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
} from '@postkit/react';

type PreviewSize = 'sm' | 'md' | 'lg';
type PreviewVariant = 'outline' | 'subtle' | 'plain';

export interface ComponentPreviewProps {
  readonly name: PostkitComponentName;
  readonly size?: PreviewSize;
  readonly variant?: PreviewVariant;
}

const previewImage = '/component-preview.svg';
const previewHref = '#component-preview';
const silentAudio =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const posterOnlyVideo = 'data:video/mp4;base64,';

const shared = (size?: PreviewSize, variant?: PreviewVariant) => ({
  size,
  variant,
});

export function ComponentPreview({
  name,
  size,
  variant,
}: ComponentPreviewProps) {
  const presentation = shared(size, variant);

  switch (name) {
    case 'AppearsOn':
      return (
        <AppearsOn
          {...presentation}
          label="Read this story on"
          showDates
          items={[
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
          ]}
        />
      );
    case 'AudienceBoundary':
      return (
        <AudienceBoundary
          {...presentation}
          audience="PostKit members"
          authorized
          showLabel
        >
          This section is available to the intended audience.
        </AudienceBoundary>
      );
    case 'Aside':
      return (
        <Aside {...presentation} title="A note from the editor" tone="note">
          Use an aside for context that supports the article without
          interrupting its main thread.
        </Aside>
      );
    case 'Audio':
      return (
        <Audio
          {...presentation}
          src={silentAudio}
          title="The portable publishing briefing"
          caption="Episode 12 · 18 minutes"
        />
      );
    case 'AuthorCard':
      return (
        <AuthorCard
          {...presentation}
          name="Ada Hart"
          role="Independent publisher"
          avatarSrc={previewImage}
          bio="Writing about durable content systems and the open web."
          links={[
            { label: 'Articles', href: previewHref },
            { label: 'Profile', href: previewHref },
          ]}
        />
      );
    case 'Callout':
      return (
        <Callout {...presentation} title="Portable by default" tone="tip">
          Keep the authored content. Change the renderer whenever the product
          needs to move.
        </Callout>
      );
    case 'CallToAction':
      return (
        <CallToAction
          {...presentation}
          eyebrow="Ready to publish?"
          title="Build a portable article system"
          description="Start with the React package and add framework adapters only when you need them."
          primaryLabel="Get started"
          primaryHref={previewHref}
          secondaryLabel="Read the guide"
          secondaryHref={previewHref}
        />
      );
    case 'CardGrid':
      return (
        <CardGrid
          {...presentation}
          title="Explore PostKit"
          description="Choose the path that matches your publishing workflow."
          columns={3}
          items={[
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
          ]}
        />
      );
    case 'Carousel':
      return (
        <Carousel
          {...presentation}
          label="Featured stories"
          items={[
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
          ]}
        />
      );
    case 'Chart':
      return (
        <Chart
          {...presentation}
          title="Readers by channel"
          description="Monthly audience growth across owned channels."
          data={[
            { label: 'June', newsletter: 28, web: 52 },
            { label: 'July', newsletter: 41, web: 68 },
            { label: 'August', newsletter: 57, web: 83 },
          ]}
          series={[
            { key: 'newsletter', label: 'Newsletter' },
            { key: 'web', label: 'Web' },
          ]}
        />
      );
    case 'CodeBlock':
      return (
        <CodeBlock
          {...presentation}
          code={`import { Callout } from '@postkit/react';\n\nexport function Note() {\n  return <Callout title="Portable">Write once.</Callout>;\n}`}
          filename="note.tsx"
          language="tsx"
          highlightLines="3"
        />
      );
    case 'CodeGroup':
      return (
        <CodeGroup
          {...presentation}
          label="Install PostKit"
          items={[
            {
              label: 'npm',
              code: 'npm install @postkit/react',
              language: 'shell',
            },
            {
              label: 'pnpm',
              code: 'pnpm add @postkit/react',
              language: 'shell',
            },
          ]}
        />
      );
    case 'Comparison':
      return (
        <Comparison
          {...presentation}
          title="Choose a rendering model"
          columns={['Static HTML', 'Interactive React']}
          items={[
            { label: 'Portable document', values: [true, true] },
            { label: 'Client JavaScript', values: ['None', 'As needed'] },
            { label: 'Interactive controls', values: [false, true] },
          ]}
        />
      );
    case 'Diff':
      return (
        <Diff
          {...presentation}
          title="theme.ts"
          diff={`- fontWeight: 'bold'\n+ fontWeight: 'inherit'\n  color: 'fg'`}
        />
      );
    case 'Disclosure':
      return (
        <Disclosure
          {...presentation}
          summary="What makes PostKit portable?"
          open
        >
          Its authored component contract is independent from the framework
          adapter and presentation layer.
        </Disclosure>
      );
    case 'Figure':
      return (
        <Figure
          {...presentation}
          src={previewImage}
          alt="Abstract PostKit editorial artwork"
          caption="A portable story can retain its meaning across renderers."
          credit="PostKit"
          aspectRatio="16 / 9"
        />
      );
    case 'FileCard':
      return (
        <FileCard
          {...presentation}
          href={previewHref}
          name="postkit-content-model.pdf"
          description="The portable document and component contract."
          fileType="PDF"
          fileSize="2.4 MB"
          download
        />
      );
    case 'FileTree':
      return (
        <FileTree
          {...presentation}
          title="Publishing project"
          items={[
            { path: 'content', type: 'folder' },
            { path: 'content/articles', type: 'folder' },
            { path: 'content/articles/hello.mdx', type: 'file', meta: '2 KB' },
            { path: 'postkit.config.ts', type: 'file' },
          ]}
        />
      );
    case 'Gallery':
      return (
        <Gallery
          {...presentation}
          title="From the field"
          description="A responsive collection of article media."
          columns={3}
          items={[
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
          ]}
        />
      );
    case 'KeyTakeaway':
      return (
        <KeyTakeaway
          {...presentation}
          eyebrow="In brief"
          title="Content should outlive its renderer"
          items={[
            'Keep semantics in the authored source.',
            'Let the host own typography and tokens.',
            'Add interaction only where it creates value.',
          ]}
        />
      );
    case 'LinkPreview':
      return (
        <LinkPreview
          {...presentation}
          href={previewHref}
          title="Designing content that travels well"
          description="A field guide to portable semantics, host-owned themes, and renderer boundaries."
          siteName="PostKit Journal"
          image={previewImage}
          imageAlt="Abstract PostKit editorial artwork"
        />
      );
    case 'NewsletterSignup':
      return (
        <NewsletterSignup
          {...presentation}
          title="The portable publishing letter"
          description="Occasional notes on content systems and the open web."
          emailPlaceholder="reader@example.com"
          buttonLabel="Join the list"
          privacy="No tracking pixels. Unsubscribe whenever you like."
        />
      );
    case 'Poll':
      return (
        <Poll
          {...presentation}
          question="Where do you publish most often?"
          description="Select one channel to see the component's feedback state."
          options={[
            { id: 'site', label: 'My own site', votes: 42 },
            { id: 'newsletter', label: 'A newsletter', votes: 31 },
            { id: 'social', label: 'Social platforms', votes: 18 },
          ]}
        />
      );
    case 'ProductCard':
      return (
        <ProductCard
          {...presentation}
          title="The Independent Publisher's Field Notes"
          description="A compact notebook for planning durable stories."
          href={previewHref}
          imageSrc={previewImage}
          imageAlt="Abstract cover artwork"
          price="$18"
          rating="4.5"
          badge="Editor's pick"
        />
      );
    case 'PullQuote':
      return (
        <PullQuote
          {...presentation}
          quote="The best publishing systems preserve meaning while letting presentation evolve."
          attribution="Ada Hart"
          cite="The Portable Web"
        />
      );
    case 'RelatedContent':
      return (
        <RelatedContent
          {...presentation}
          title="Continue reading"
          items={[
            {
              title: 'Authoring with portable directives',
              description:
                'Add rich semantics without coupling content to React.',
              meta: '7 min read',
              href: previewHref,
            },
            {
              title: 'Composing a host-owned theme',
              description:
                'Layer PostKit recipes into an existing Chakra system.',
              meta: '5 min read',
              href: previewHref,
            },
          ]}
        />
      );
    case 'SeriesNavigation':
      return (
        <SeriesNavigation
          {...presentation}
          title="Portable publishing foundations"
          current="2"
          total="4"
          previous={{ title: 'The content contract', href: previewHref }}
          next={{ title: 'Framework adapters', href: previewHref }}
        />
      );
    case 'ShareActions':
      return (
        <ShareActions
          {...presentation}
          url="https://postkit.test/components"
          title="PostKit component library"
          text="Publishing components that travel well."
          services={['copy', 'email']}
          label="Share this guide"
        />
      );
    case 'SocialPost':
      return (
        <SocialPost
          {...presentation}
          href={previewHref}
          service="bluesky"
          authorName="PostKit"
          authorHandle="@postkit.test"
          authorAvatar={previewImage}
          text="A portable component contract lets the same story feel at home in every renderer."
          publishedAt="2026-08-28T14:00:00Z"
        />
      );
    case 'SponsorBlock':
      return (
        <SponsorBlock
          {...presentation}
          name="Open Web Fund"
          message="Supporting independent tools for durable, portable publishing."
          href={previewHref}
          actionLabel="Meet the sponsor"
          logoSrc={previewImage}
          logoAlt="Open Web Fund"
        />
      );
    case 'Stat':
      return (
        <Stat
          {...presentation}
          value="84%"
          label="Content reused across channels"
          trend="↑ 12% this quarter"
          description="Across web, email, and syndication feeds."
        />
      );
    case 'Steps':
      return (
        <Steps
          {...presentation}
          items={[
            { title: 'Install', description: 'Add the React package.' },
            {
              title: 'Provide',
              description: 'Connect PostKit to your Chakra system.',
            },
            {
              title: 'Publish',
              description: 'Render the same content wherever it belongs.',
            },
          ]}
        />
      );
    case 'Tabs':
      return (
        <Tabs
          {...presentation}
          label="Rendering approaches"
          items={[
            {
              label: 'MDX',
              content: 'Map authored tags to PostKit components.',
            },
            {
              label: 'Markdown',
              content: 'Use portable directives for rich content.',
            },
            {
              label: 'JSON',
              content: 'Render a structured portable document.',
            },
          ]}
        />
      );
    case 'Terminal':
      return (
        <Terminal
          {...presentation}
          title="Terminal"
          prompt="$"
          command="npm install @postkit/react"
          output="added 1 package in 842ms"
        />
      );
    case 'Video':
      return (
        <Video
          {...presentation}
          src={posterOnlyVideo}
          poster={previewImage}
          title="PostKit in two minutes"
          caption="A quick tour of the portable publishing contract."
        />
      );
    default:
      return (
        <Box color="fg.muted" fontSize="sm">
          Preview unavailable.
        </Box>
      );
  }
}
