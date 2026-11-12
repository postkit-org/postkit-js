import type { PostkitViewLoader } from './lazy-view.js';
import type { PostkitHeadlessViewName } from './headless-view-names.js';

/**
 * A loader per headless view, keyed by component name: each imports only that
 * view's module, so a bundler splits every view (and the behaviour it uses,
 * such as a Zag machine) into its own chunk. The keys match
 * `postkitHeadlessViews`, in the same order; the lazy headless renderer
 * (`postkitHeadlessRenderer`, `createPostkit`'s default) is built on them.
 */
export const postkitHeadlessViewLoaders: Readonly<
  Record<PostkitHeadlessViewName, PostkitViewLoader>
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
  Chart: () => import('../components/chart/chart.js').then((m) => m.Chart),
  CodeBlock: () =>
    import('../components/code-block/code-block.js').then((m) => m.CodeBlock),
  CodeGroup: () =>
    import('../components/code-group/code-group.js').then((m) => m.CodeGroup),
  Carousel: () =>
    import('../components/carousel/carousel.js').then((m) => m.Carousel),
  LinkPreview: () =>
    import('../components/link-preview/link-preview.js').then(
      (m) => m.LinkPreview,
    ),
  NewsletterSignup: () =>
    import('../components/newsletter-signup/newsletter-signup.js').then(
      (m) => m.NewsletterSignup,
    ),
  Poll: () => import('../components/poll/poll.js').then((m) => m.Poll),
  ShareActions: () =>
    import('../components/share-actions/share-actions.js').then(
      (m) => m.ShareActions,
    ),
  SocialPost: () =>
    import('../components/social-post/social-post.js').then(
      (m) => m.SocialPost,
    ),
  Tabs: () => import('../components/tabs/tabs.js').then((m) => m.Tabs),
  Figure: () => import('../components/figure/figure.js').then((m) => m.Figure),
  Video: () => import('../components/video/video.js').then((m) => m.Video),
  Device: () => import('../components/device/device.js').then((m) => m.Device),
  Footnote: () =>
    import('../components/footnote/footnote.js').then((m) => m.Footnote),
  Footnotes: () =>
    import('../components/footnotes/footnotes.js').then((m) => m.Footnotes),
});
