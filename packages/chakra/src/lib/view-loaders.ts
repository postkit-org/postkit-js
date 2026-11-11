import type { PostkitViewLoader } from '@postkit/react';

import type { ProseComponents } from './components/prose.js';
import type { PostkitMdxComponents } from './mdx-components.js';

/** The names of the component views (not prose) in `postkitMdxComponents`. */
export type PostkitChakraViewName = Exclude<
  keyof PostkitMdxComponents,
  keyof ProseComponents
>;

/**
 * A loader per Chakra view, keyed by component name: each imports only that
 * view's module, so a bundler splits every view into its own chunk. The keys
 * match `postkitChakraViews`, in the same order. `postkitChakraLazyViews` and
 * `createPostkitLazyMdxComponents` are built on them.
 */
export const postkitChakraViewLoaders: Readonly<
  Record<PostkitChakraViewName, PostkitViewLoader>
> = Object.freeze({
  Aside: () => import('../components/aside/aside.js').then((m) => m.Aside),
  Callout: () =>
    import('../components/callout/callout.js').then((m) => m.Callout),
  CardGrid: () =>
    import('../components/card-grid/card-grid.js').then((m) => m.CardGrid),
  Disclosure: () =>
    import('../components/disclosure/disclosure.js').then((m) => m.Disclosure),
  Gallery: () =>
    import('../components/gallery/gallery.js').then((m) => m.Gallery),
  Steps: () => import('../components/steps/steps.js').then((m) => m.Steps),
  Tabs: () => import('../components/tabs/tabs.js').then((m) => m.Tabs),
  CodeBlock: () =>
    import('../components/code-block/code-block.js').then((m) => m.CodeBlock),
  CodeGroup: () =>
    import('../components/code-group/code-group.js').then((m) => m.CodeGroup),
  Diff: () => import('../components/diff/diff.js').then((m) => m.Diff),
  FileCard: () =>
    import('../components/file-card/file-card.js').then((m) => m.FileCard),
  FileTree: () =>
    import('../components/file-tree/file-tree.js').then((m) => m.FileTree),
  Terminal: () =>
    import('../components/terminal/terminal.js').then((m) => m.Terminal),
  AudienceBoundary: () =>
    import('../components/audience-boundary/audience-boundary.js').then(
      (m) => m.AudienceBoundary,
    ),
  Comparison: () =>
    import('../components/comparison/comparison.js').then((m) => m.Comparison),
  KeyTakeaway: () =>
    import('../components/key-takeaway/key-takeaway.js').then(
      (m) => m.KeyTakeaway,
    ),
  Poll: () => import('../components/poll/poll.js').then((m) => m.Poll),
  ProductCard: () =>
    import('../components/product-card/product-card.js').then(
      (m) => m.ProductCard,
    ),
  PullQuote: () =>
    import('../components/pull-quote/pull-quote.js').then((m) => m.PullQuote),
  RelatedContent: () =>
    import('../components/related-content/related-content.js').then(
      (m) => m.RelatedContent,
    ),
  SeriesNavigation: () =>
    import('../components/series-navigation/series-navigation.js').then(
      (m) => m.SeriesNavigation,
    ),
  SponsorBlock: () =>
    import('../components/sponsor-block/sponsor-block.js').then(
      (m) => m.SponsorBlock,
    ),
  Stat: () => import('../components/stat/stat.js').then((m) => m.Stat),
  AppearsOn: () =>
    import('../components/appears-on/appears-on.js').then((m) => m.AppearsOn),
  Audio: () => import('../components/audio/audio.js').then((m) => m.Audio),
  AuthorCard: () =>
    import('../components/author-card/author-card.js').then(
      (m) => m.AuthorCard,
    ),
  CallToAction: () =>
    import('../components/call-to-action/call-to-action.js').then(
      (m) => m.CallToAction,
    ),
  Carousel: () =>
    import('../components/carousel/carousel.js').then((m) => m.Carousel),
  Chart: () => import('../components/chart/chart.js').then((m) => m.Chart),
  Figure: () => import('../components/figure/figure.js').then((m) => m.Figure),
  LinkPreview: () =>
    import('../components/link-preview/link-preview.js').then(
      (m) => m.LinkPreview,
    ),
  NewsletterSignup: () =>
    import('../components/newsletter-signup/newsletter-signup.js').then(
      (m) => m.NewsletterSignup,
    ),
  ShareActions: () =>
    import('../components/share-actions/share-actions.js').then(
      (m) => m.ShareActions,
    ),
  SocialPost: () =>
    import('../components/social-post/social-post.js').then(
      (m) => m.SocialPost,
    ),
  Video: () => import('../components/video/video.js').then((m) => m.Video),
  Device: () => import('../components/device/device.js').then((m) => m.Device),
  Footnote: () =>
    import('../components/footnote/footnote.js').then((m) => m.Footnote),
  Footnotes: () =>
    import('../components/footnotes/footnotes.js').then((m) => m.Footnotes),
});

/**
 * The names of the Chakra views, without importing them: the catalog's
 * computed `support.chakra` reads it. The same names as `postkitChakraViews`.
 */
export const postkitChakraViewNames: readonly PostkitChakraViewName[] =
  Object.freeze(
    Object.keys(postkitChakraViewLoaders) as PostkitChakraViewName[],
  );
