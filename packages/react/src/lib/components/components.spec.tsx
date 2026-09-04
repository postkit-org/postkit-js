// @vitest-environment node

import {
  createSystem,
  defaultConfig,
  defaultSystem,
  defineSlotRecipe,
} from '@chakra-ui/react';
import { createPostkitSocialPostSnapshot } from '@postkit/unfurl';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppearsOn } from './appears-on.js';
import { Audio } from './audio.js';
import {
  Aside,
  Callout,
  CardGrid,
  Disclosure,
  Gallery,
  Steps,
  Tabs,
} from './article-structure.js';
import { AuthorCard } from './author-card.js';
import { CallToAction } from './call-to-action.js';
import { Carousel } from './carousel.js';
import { Chart } from './chart.js';
import { Figure } from './figure.js';
import { LinkPreview } from './link-preview.js';
import { NewsletterSignup } from './newsletter-signup.js';
import { PostkitProvider } from '../provider.js';
import { ShareActions } from './share-actions.js';
import { SocialPost } from './social-post.js';
import { Video } from './video.js';
import {
  CodeBlock,
  CodeGroup,
  Diff,
  FileCard,
  FileTree,
  Terminal,
} from './technical-content.js';
import {
  AudienceBoundary,
  Comparison,
  KeyTakeaway,
  Poll,
  ProductCard,
  PullQuote,
  RelatedContent,
  SeriesNavigation,
  SponsorBlock,
  Stat,
} from './publication.js';

function render(component: React.ReactNode): string {
  return renderToStaticMarkup(
    <PostkitProvider system={defaultSystem}>{component}</PostkitProvider>,
  );
}

function renderWithSystem(
  component: React.ReactNode,
  system: Parameters<typeof PostkitProvider>[0]['system'],
): string {
  return renderToStaticMarkup(
    <PostkitProvider system={system}>{component}</PostkitProvider>,
  );
}

describe('Postkit article components', () => {
  it('inherits host recipes through composed multipart primitives', () => {
    const system = createSystem(defaultConfig, {
      theme: {
        slotRecipes: {
          alert: defineSlotRecipe({
            className: 'host-alert',
            slots: ['root', 'indicator', 'content', 'title', 'description'],
          }),
          avatar: defineSlotRecipe({
            className: 'host-avatar',
            slots: ['root', 'image', 'fallback'],
          }),
          card: defineSlotRecipe({
            className: 'host-card',
            slots: ['root', 'header', 'body', 'footer', 'title', 'description'],
          }),
          carousel: defineSlotRecipe({
            className: 'host-carousel',
            slots: [
              'root',
              'itemGroup',
              'item',
              'control',
              'nextTrigger',
              'prevTrigger',
              'progressText',
            ],
          }),
          list: defineSlotRecipe({
            className: 'host-list',
            slots: ['root', 'item', 'indicator'],
          }),
        },
      },
    });
    const markup = renderWithSystem(
      <>
        <AuthorCard name="Ada Lovelace" />
        <Callout title="Host alert">Host-owned presentation.</Callout>
        <ProductCard title="Field guide" href="/guide" />
        <Carousel items={[{ title: 'First' }, { title: 'Second' }]} />
        <Steps items={[{ title: 'Install' }, { title: 'Render' }]} />
      </>,
      system,
    );

    expect(markup).toContain('host-avatar__root');
    expect(markup).toContain('host-card__root');
    expect(markup).toContain('host-card__body');
    expect(markup).toContain('host-alert__root');
    expect(markup).toContain('host-alert__content');
    expect(markup).toContain('host-carousel__root');
    expect(markup).toContain('host-carousel__item');
    expect(markup).toContain('host-carousel__control');
    expect(markup).toContain('host-list__root');
    expect(markup).toContain('host-list__item');
  });

  it('server-renders publication and audience components', () => {
    const pullQuote = render(
      <PullQuote
        quote="Publishing is a process."
        attribution="Ada"
        cite="Field Notes"
      />,
    );
    const takeaway = render(
      <KeyTakeaway
        items={['Keep source portable.', 'Preview the destination.']}
      />,
    );
    const stat = render(
      <Stat value="98%" label="Reader completion" trend="+4%" />,
    );
    const comparison = render(
      <Comparison
        columns={['Free', 'Pro']}
        items={[{ label: 'Previews', values: [true, true] }]}
      />,
    );
    const poll = render(
      <Poll
        question="Which format?"
        options={[
          { id: 'md', label: 'Markdown', votes: 8 },
          { id: 'mdx', label: 'MDX', votes: 2 },
        ]}
      />,
    );
    const product = render(
      <ProductCard
        title="Field guide"
        href="/shop/guide"
        price="$20"
        rating={4.8}
      />,
    );
    const related = render(
      <RelatedContent
        items={[{ title: 'Rendering guide', href: '/rendering' }]}
      />,
    );
    const series = render(
      <SeriesNavigation
        title="Portable publishing"
        current={2}
        total={4}
        previous={{ title: 'Authoring', href: '/authoring' }}
        next={{ title: 'Delivery', href: '/delivery' }}
      />,
    );
    const sponsor = render(
      <SponsorBlock
        name="Example"
        message="Supports independent publishing."
        href="https://example.com"
      />,
    );
    const boundary = render(
      <AudienceBoundary
        audience="members"
        authorized={false}
        fallback="Members only."
        showLabel
      >
        Protected content.
      </AudienceBoundary>,
    );

    expect(pullQuote).toContain('<blockquote');
    expect(pullQuote).toContain('<cite');
    expect(pullQuote).toContain('chakra-blockquote__root');
    expect(pullQuote).toContain('chakra-blockquote__content');
    expect(takeaway).toContain('data-postkit-component="KeyTakeaway"');
    expect(takeaway).toContain('chakra-list__root');
    expect(takeaway).toContain('chakra-list__item');
    expect(takeaway).toContain('chakra-alert__root');
    expect(stat).toContain('98%');
    expect(stat).toContain('chakra-stat__root');
    expect(stat).toContain('chakra-stat__valueText');
    expect(comparison).toContain('<table');
    expect(comparison).toContain('chakra-table__root');
    expect(comparison).toContain('scope="row"');
    expect(poll).toContain('aria-pressed="false"');
    expect(poll).toContain('chakra-button');
    expect(poll).toContain('80%');
    expect(poll).toContain('chakra-progress__root');
    expect(poll).toContain('chakra-progress__range');
    expect(product).toContain('rel="sponsored"');
    expect(product).toContain('4.8 out of 5 stars');
    expect(product).toContain('chakra-rating-group__root');
    expect(product).toContain('chakra-card__root');
    expect(product).toContain('chakra-card__body');
    expect(product).toContain('chakra-card__footer');
    expect(related).toContain('data-postkit-component="RelatedContent"');
    expect(related).toContain('chakra-list__root');
    expect(related).toContain('chakra-card__root');
    expect(series).toContain('rel="prev"');
    expect(series).toContain('rel="next"');
    expect(sponsor).toContain('aria-label="Sponsored by Example"');
    expect(sponsor).toContain('chakra-card__root');
    expect(boundary).toContain('data-postkit-audience="members"');
    expect(boundary).toContain('Members only.');
    expect(boundary).not.toContain('Protected content.');
  });

  it('server-renders technical content and file components', () => {
    const code = render(
      <CodeBlock
        code={'const answer = 42;\nconsole.log(answer);'}
        language="typescript"
        filename="answer.ts"
        highlightLines="2"
      />,
    );
    const group = render(
      <CodeGroup
        items={[
          { label: 'npm', code: 'npm install @postkit/react' },
          { label: 'pnpm', code: 'pnpm add @postkit/react' },
        ]}
      />,
    );
    const terminal = render(
      <Terminal command="npm test" output="65 tests passed" />,
    );
    const diff = render(
      <Diff
        diff={'-const old = true\n+const current = true'}
        title="config.ts"
      />,
    );
    const tree = render(
      <FileTree
        title="Project"
        items={[
          { path: 'src', type: 'folder' },
          { path: 'src/index.ts', type: 'file', meta: 'entry' },
        ]}
      />,
    );
    const file = render(
      <FileCard
        href="/guide.pdf"
        name="guide.pdf"
        description="The printable field guide."
        fileSize="2.4 MB"
      />,
    );

    expect(code).toContain('data-postkit-component="CodeBlock"');
    expect(code).toContain('code-block__root');
    expect(code).toContain('postkit-code-block__title');
    expect(code).toContain('postkit-code-block__filename');
    expect(code).toContain('postkit-code-block__control');
    expect(code).toContain('postkit-code-block__actions');
    expect(code).toContain('postkit-code-block__copyTrigger');
    expect(code).toContain('postkit-code-block__button');
    expect(code).toContain('postkit-code-block__copyIndicator');
    expect(code).toContain('postkit-code-block__content');
    expect(code).toContain('postkit-code-block__scroller');
    expect(code).toContain('postkit-code-block__codeText');
    expect(code).toContain('postkit-code-block__lineContent');
    expect(code).toContain('data-highlight=""');
    expect(code).not.toContain('data-has-line-numbers=""');
    expect(code).toContain('aria-label="Copy code"');
    expect(code).toContain('chakra-button');
    expect(group).toContain('data-postkit-component="CodeGroup"');
    expect(group).toContain('role="tablist"');
    expect(group).toContain('chakra-tabs__trigger');
    expect(terminal).toContain('data-postkit-component="Terminal"');
    expect(terminal).toContain('<samp');
    expect(diff).toContain('data-diff="deletion"');
    expect(diff).toContain('data-diff="addition"');
    expect(tree).toContain('data-postkit-component="FileTree"');
    expect(tree).toContain('chakra-list__root');
    expect(tree).toContain('chakra-list__item');
    expect(tree).toContain('chakra-heading');
    expect(tree).toContain('index.ts');
    expect(file).toContain('download=""');
    expect(file).toContain('2.4 MB');
    expect(file).toContain('chakra-card__root');
  });

  it('server-renders foundational article structure components', () => {
    const callout = render(
      <Callout title="Heads up" tone="warning">
        Back up the vault before continuing.
      </Callout>,
    );
    const aside = render(<Aside title="Context">Related history.</Aside>);
    const gallery = render(
      <Gallery
        title="Field work"
        columns={3}
        items={[
          { src: '/one.jpg', alt: 'A mountain', caption: 'Day one' },
          { src: '/two.jpg', alt: 'A lake' },
        ]}
      />,
    );
    const disclosure = render(
      <Disclosure summary="What is PostKit?" open>
        Article components for Markdown and MDX.
      </Disclosure>,
    );
    const tabs = render(
      <Tabs
        label="Install commands"
        items={[
          { label: 'npm', content: 'npm install @postkit/react' },
          { label: 'pnpm', content: 'pnpm add @postkit/react' },
        ]}
      />,
    );
    const steps = render(
      <Steps
        items={[
          { title: 'Install', description: 'Add the package.' },
          { title: 'Render', description: 'Map the components.' },
        ]}
      />,
    );
    const cards = render(
      <CardGrid
        columns={2}
        items={[
          {
            title: 'Guide',
            description: 'Read the guide.',
            href: '/guide',
          },
        ]}
      />,
    );

    expect(callout).toContain('data-postkit-component="Callout"');
    expect(callout).toContain('data-postkit-tone="warning"');
    expect(callout).toContain('chakra-alert__root');
    expect(callout).toContain('chakra-alert__content');
    expect(aside).toContain('data-postkit-component="Aside"');
    expect(gallery).toContain('data-postkit-component="Gallery"');
    expect(gallery).toContain('<figure');
    expect(gallery).toContain('alt="A mountain"');
    expect(disclosure).toContain('<details');
    expect(disclosure).toContain('<summary');
    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('role="tabpanel"');
    expect(tabs).toContain('chakra-tabs__trigger');
    expect(steps).toContain('<ol');
    expect(steps).toContain('chakra-list__root');
    expect(steps).toContain('chakra-list__item');
    expect(cards).toContain('postkit-card-grid__card');
    expect(cards).toContain('chakra-card__root');
    expect(cards).toContain('chakra-card__body');
    expect(cards).toContain('href="/guide"');
  });

  it('server-renders standard article conversion and identity blocks', () => {
    const author = render(
      <AuthorCard
        name="Ada Lovelace"
        role="Contributing editor"
        avatarSrc="/ada.jpg"
        bio="Writes about analytical engines."
        href="/authors/ada"
        links='[{"label":"Archive","href":"/authors/ada/archive"}]'
      />,
    );
    const cta = render(
      <CallToAction
        eyebrow="Continue reading"
        title="Explore the field guide"
        description="A durable reference for the full workflow."
        primaryLabel="Open the guide"
        primaryHref="/guide"
        secondaryLabel="View examples"
        secondaryHref="/examples"
      />,
    );
    const newsletter = render(
      <PostkitProvider
        newsletter={{
          action: 'https://newsletter.example/subscribe',
          hiddenFields: { source: 'postkit' },
        }}
      >
        <NewsletterSignup
          title="Get the field notes"
          list="weekly"
          privacy="Unsubscribe at any time."
        />
      </PostkitProvider>,
    );

    expect(author).toContain('data-postkit-component="AuthorCard"');
    expect(author).toContain('aria-label="About Ada Lovelace"');
    expect(author).toContain('rel="author"');
    expect(author).toContain('postkit-author-card__links');
    expect(author).toContain('chakra-list__root');
    expect(author).toContain('chakra-heading');
    expect(author).toContain('chakra-avatar__root');
    expect(author).toContain('chakra-avatar__image');
    expect(author).toContain('chakra-card__root');
    expect(cta).toContain('data-postkit-component="CallToAction"');
    expect(cta).toContain('<h2');
    expect(cta).toContain('postkit-call-to-action__primaryAction');
    expect(cta).toContain('chakra-button');
    expect(newsletter).toContain(
      'action="https://newsletter.example/subscribe"',
    );
    expect(newsletter).toContain('name="list" value="weekly"');
    expect(newsletter).toContain('name="source" value="postkit"');
    expect(newsletter).toContain('data-postkit-configured="true"');
    expect(newsletter).toContain('chakra-input');
    expect(newsletter).toContain('chakra-button');
    expect(newsletter).toContain('chakra-field__root');
    expect(newsletter).toContain('chakra-field__label');
  });

  it('server-renders a labeled carousel from literal JSON', () => {
    const markup = render(
      <Carousel
        label="Field notes"
        items={JSON.stringify([
          {
            id: 'one',
            image: { src: '/one.jpg', alt: 'A mountain ridge' },
            title: 'Day one',
          },
          {
            id: 'two',
            title: 'Day two',
            description: 'Back at sea level.',
          },
        ])}
      />,
    );

    expect(markup).toContain('data-postkit-component="Carousel"');
    expect(markup).toContain('postkit-carousel__root');
    expect(markup).toContain('postkit-carousel__slide');
    expect(markup).toContain('postkit-carousel__controls');
    expect(markup).toContain('carousel__root');
    expect(markup).toContain('carousel__itemGroup');
    expect(markup).toContain('carousel__item');
    expect(markup).toContain('carousel__control');
    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('aria-label="Field notes"');
    expect(markup).toContain('alt="A mountain ridge"');
    expect(markup).toContain('1 / 2');
  });

  it('server-renders native video and audio controls with fallbacks', () => {
    const video = render(
      <Video
        src="/interview.mp4"
        title="Interview"
        caption="Recorded in New York."
        tracks={[
          {
            src: '/interview.en.vtt',
            srcLang: 'en',
            label: 'English',
            default: true,
          },
        ]}
      />,
    );
    const audio = render(
      <Audio
        src="/episode.mp3"
        title="Episode 12"
        caption="A conversation about durable publishing."
      />,
    );

    expect(video).toContain('data-postkit-component="Video"');
    expect(video).toContain('postkit-video__frame');
    expect(video).toContain('postkit-video__player');
    expect(video).toContain('chakra-aspect-ratio');
    expect(video).toContain('<video');
    expect(video).toContain('controls=""');
    expect(video).toContain('srcLang="en"');
    expect(audio).toContain('data-postkit-component="Audio"');
    expect(audio).toContain('postkit-audio__title');
    expect(audio).toContain('postkit-audio__player');
    expect(audio).toContain('aria-label="Episode 12"');
  });

  it('server-renders an accessible SVG chart and source table', () => {
    const markup = render(
      <Chart
        title="Quarterly revenue"
        description="Revenue increased in the second quarter."
        type="line"
        showTable="true"
        data='[{"label":"Q1","revenue":12},{"label":"Q2","revenue":18}]'
        series='[{"key":"revenue","label":"Revenue"}]'
      />,
    );

    expect(markup).toContain('data-postkit-component="Chart"');
    expect(markup).toContain('postkit-chart__root');
    expect(markup).toContain('postkit-chart__seriesMark');
    expect(markup).toContain('postkit-chart__table');
    expect(markup).toContain('<svg');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('<table');
    expect(markup).toContain('chakra-table__root');
    expect(markup).toContain('Quarterly revenue');
    expect(markup).toContain('Q2, Revenue: 18');
  });

  it('server-renders a semantic responsive figure with caption and credit', () => {
    const markup = render(
      <Figure
        src="/studio.jpg"
        alt="A recording studio overlooking Manhattan"
        caption="The studio during the final recording session."
        credit="Photo by Ryan Hefner"
        creditHref="https://example.com/credit"
        href="/studio-full.jpg"
        width="1600"
        height={900}
        aspectRatio="16 / 9"
        layout="wide"
        objectPosition="center 30%"
      />,
    );

    expect(markup).toContain('data-postkit-component="Figure"');
    expect(markup).toContain('postkit-figure__media');
    expect(markup).toContain('postkit-figure__image');
    expect(markup).toContain('postkit-figure__figcaption');
    expect(markup).toContain('postkit-figure__creditLink');
    expect(markup).toContain('<figure');
    expect(markup).toContain('<figcaption');
    expect(markup).toContain('alt="A recording studio overlooking Manhattan"');
    expect(markup).toContain('width="1600"');
    expect(markup).toContain('height="900"');
    expect(markup).toContain('Photo by Ryan Hefner');
  });

  it('renders small and large link cards from normalized provider metadata', () => {
    const metadata = {
      requestedUrl: 'https://example.com/article',
      url: 'https://example.com/article',
      title: 'A portable article',
      description: 'Metadata resolved once and rendered anywhere.',
      siteName: 'Example',
      favicon: 'https://example.com/favicon.png',
      images: [
        {
          src: 'https://example.com/one.jpg',
          alt: 'The first preview',
          width: 1200,
          height: 630,
        },
        {
          src: 'https://example.com/two.jpg',
          alt: 'The second preview',
        },
      ],
      audio: [],
      video: [],
      provider: { id: 'opengraphs' },
    } as const;
    const small = render(
      <LinkPreview
        href="https://example.com/article"
        metadata={metadata}
        size="sm"
      />,
    );
    const large = render(
      <LinkPreview
        href="https://example.com/article"
        metadata={metadata}
        size="lg"
        images="carousel"
      />,
    );

    expect(small).toContain('data-postkit-component="LinkPreview"');
    expect(small).toContain('data-postkit-provider="opengraphs"');
    expect(small).toContain('postkit-link-preview__siteRow');
    expect(small).toContain('chakra-card__root');
    expect(small).toContain('chakra-card__body');
    expect(small).toContain('A portable article');
    expect(large).toContain('postkit-link-preview__carousel');
    expect(large).toContain('data-postkit-component="Carousel"');
    expect(large).toContain('1 / 2');
  });

  it('renders native media and click-to-load isolated embeds without injecting provider HTML', () => {
    const media = render(
      <LinkPreview
        href="https://example.com/watch"
        presentation="auto"
        metadata={{
          requestedUrl: 'https://example.com/watch',
          url: 'https://example.com/watch',
          title: 'A film',
          images: [{ src: 'https://example.com/poster.jpg' }],
          audio: [],
          video: [
            {
              src: 'https://example.com/film.mp4',
              type: 'video/mp4',
              width: 1920,
              height: 1080,
            },
          ],
          provider: { id: 'opengraphs' },
        }}
      />,
    );
    const embed = render(
      <LinkPreview
        href="https://video.example.com/watch"
        presentation="embed"
        activation="click"
        metadata={{
          requestedUrl: 'https://video.example.com/watch',
          url: 'https://video.example.com/watch',
          title: 'Remote video',
          siteName: 'Video Example',
          images: [],
          audio: [],
          video: [],
          embed: {
            type: 'video',
            src: 'https://player.example.com/embed/1',
            rawHtml: '<script>unsafe()</script>',
            thumbnail: {
              src: 'https://video.example.com/embed-thumbnail.jpg',
              alt: 'Remote video',
            },
          },
          provider: { id: 'iframely' },
        }}
      />,
    );

    expect(media).toContain('data-postkit-presentation="media"');
    expect(media).toContain('data-postkit-component="Video"');
    expect(media).toContain('src="https://example.com/film.mp4"');
    expect(embed).toContain('Load interactive content from Video Example?');
    expect(embed).toContain('Load embed');
    expect(embed).toContain('https://video.example.com/embed-thumbnail.jpg');
    expect(embed).not.toContain('unsafe()');
    expect(embed).not.toContain('<iframe');
  });

  it('can immediately render a validated iframe source', () => {
    const markup = render(
      <LinkPreview
        href="https://video.example.com/watch"
        presentation="embed"
        activation="immediate"
        metadata={{
          requestedUrl: 'https://video.example.com/watch',
          url: 'https://video.example.com/watch',
          title: 'Remote video',
          images: [],
          audio: [],
          video: [],
          embed: {
            type: 'video',
            src: 'https://player.example.com/embed/1',
          },
          provider: { id: 'embedly' },
        }}
      />,
    );

    expect(markup).toContain('<iframe');
    expect(markup).toContain('src="https://player.example.com/embed/1"');
    expect(markup).toContain('sandbox="allow-scripts allow-same-origin');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('chakra-aspect-ratio');
  });

  it('renders syndicated destinations and share actions from literal JSON', () => {
    const appearances = render(
      <AppearsOn
        label="Also published on"
        presentation="badges"
        items='[{"service":"bluesky","url":"https://bsky.app/post/1","status":"published"},{"service":"medium","url":"https://medium.com/post/1"}]'
      />,
    );
    const actions = render(
      <ShareActions
        url="https://example.com/article"
        services='["native","copy","email"]'
      />,
    );

    expect(appearances).toContain('data-postkit-component="AppearsOn"');
    expect(appearances).toContain('chakra-list__root');
    expect(appearances).toContain('rel="syndication"');
    expect(appearances).toContain('Bluesky');
    expect(appearances).toContain('Medium');
    expect(actions).toContain('data-postkit-component="ShareActions"');
    expect(actions).toContain('Copy link');
    expect(actions).toContain('Email');
  });

  it('renders a consistently branded social post and lets auto LinkPreview delegate to it', () => {
    const metadata = {
      requestedUrl: 'https://social.example/post/1',
      url: 'https://social.example/post/1',
      images: [],
      audio: [],
      video: [],
      provider: { id: 'opengraphs' },
      social: {
        service: 'bluesky',
        url: 'https://social.example/post/1',
        author: {
          name: 'Ada Example',
          handle: '@ada.example',
          avatar: 'https://social.example/ada.jpg',
        },
        text: 'A post syndicated from the canonical article.',
        publishedAt: '2026-07-26T12:00:00Z',
        images: [
          {
            src: 'https://social.example/post.jpg',
            alt: 'Post attachment',
          },
        ],
        video: [],
        metrics: { replies: 2, reposts: 4, likes: 12 },
      },
    } as const;
    const social = render(
      <SocialPost
        href="https://social.example/post/1"
        metadata={metadata}
        branding="full"
        showMetrics
      />,
    );
    const delegated = render(
      <LinkPreview
        href="https://social.example/post/1"
        metadata={metadata}
        presentation="auto"
      />,
    );

    expect(social).toContain('data-postkit-component="SocialPost"');
    expect(social).toContain('data-postkit-service="bluesky"');
    expect(social).toContain('Ada Example');
    expect(social).toContain('12 likes');
    expect(social).toContain('View original');
    expect(social).toContain('chakra-card__root');
    expect(delegated).toContain('data-postkit-component="SocialPost"');
    expect(delegated).not.toContain('data-postkit-component="LinkPreview"');
  });

  it('renders versioned snapshot provenance and permits hiding it', () => {
    const metadata = {
      requestedUrl: 'https://social.example/post/1',
      url: 'https://social.example/post/1',
      images: [],
      audio: [],
      video: [],
      provider: { id: 'opengraphs' },
      social: {
        service: 'bluesky',
        url: 'https://social.example/post/1',
        text: 'The captured version.',
        images: [],
        video: [],
      },
    } as const;
    const snapshot = createPostkitSocialPostSnapshot(metadata, {
      capturedAt: '2026-07-26T18:31:00.000Z',
      resolvedAt: '2026-07-26T18:29:42.000Z',
      cacheStrategy: 'refresh',
      cacheResult: 'hit',
    });
    const visible = render(
      <SocialPost
        href={metadata.url}
        metadata={snapshot}
        resolution="snapshot"
      />,
    );
    const hidden = render(
      <SocialPost
        href={metadata.url}
        metadata={JSON.stringify(snapshot)}
        resolution="snapshot"
        snapshotInfo="hidden"
      />,
    );

    expect(visible).toContain('data-postkit-resolution="snapshot"');
    expect(visible).toContain('data-postkit-resolution-mode="snapshot"');
    expect(visible).toContain(
      'data-postkit-snapshot-captured-at="2026-07-26T18:31:00.000Z"',
    );
    expect(visible).toContain('Snapshot captured');
    expect(visible).toContain('via opengraphs');
    expect(visible).toContain('Resolver data fetched');
    expect(visible).toContain('cache hit');
    expect(visible).toContain('refresh strategy');
    expect(hidden).not.toContain('Snapshot captured');
  });

  it('rejects malformed JSON authoring props', () => {
    expect(() => render(<Chart title="Broken" data="not-json" />)).toThrow(
      'Postkit Chart data must contain valid JSON.',
    );
  });

  it('accepts recipe variants, an unstyled mode, and per-slot styles', () => {
    const markup = render(
      <Audio
        src="/episode.mp3"
        title="Custom player"
        size="lg"
        variant="subtle"
        slotStyles={{ title: { color: 'red.500' } }}
        rootProps={{ className: 'site-audio' }}
      />,
    );
    const unstyledMarkup = render(
      <Audio src="/episode.mp3" title="Unstyled player" unstyled />,
    );

    expect(markup).toContain('postkit-audio__root site-audio');
    expect(markup).toContain('var(--chakra-colors-red-500)');
    expect(unstyledMarkup).toMatch(/<figure[^>]*class="postkit-audio__root"/);
  });

  it('renders alternate article structure branches', () => {
    const callouts = render(
      <>
        <Callout tone="tip" unstyled>
          Tip
        </Callout>
        <Callout tone="caution">Caution</Callout>
        <Callout tone="important">Important</Callout>
        <Callout tone={'unknown' as never}>Fallback</Callout>
      </>,
    );
    const gallery = render(
      <Gallery
        description="Supporting gallery copy."
        items={[
          {
            src: '/linked.jpg',
            alt: '',
            href: '/full-size.jpg',
          },
        ]}
        unstyled
      />,
    );
    const disclosure = render(
      <Disclosure summary="Details" unstyled>
        Expanded content.
      </Disclosure>,
    );
    const steps = render(<Steps items={[]} unstyled />);
    const cards = render(
      <CardGrid
        title="Resources"
        description="Choose a guide."
        items={[
          {
            title: 'Visual guide',
            image: { src: '/guide.jpg', alt: 'Guide cover' },
            meta: 'PDF',
          },
        ]}
        unstyled
      />,
    );

    expect(callouts).toContain('data-postkit-tone="tip"');
    expect(callouts).toContain('data-postkit-tone="caution"');
    expect(callouts).toContain('data-postkit-tone="important"');
    expect(callouts).toContain('data-postkit-tone="note"');
    expect(gallery).toContain('Supporting gallery copy.');
    expect(gallery).toContain('aria-label="Open image"');
    expect(disclosure).toContain('Expanded content.');
    expect(steps).toContain('<ol');
    expect(cards).toContain('/guide.jpg');
    expect(cards).toContain('Choose a guide.');
    expect(cards).toContain('PDF');
    expect(cards).not.toContain('Learn more');
  });
});
