/**
 * The component names `postkitHeadlessViews` has a view for, without
 * importing the views: the manifest's computed `support.headless` reads it,
 * so a catalog or manifest doesn't ship every view. Keep it in step with
 * `postkitHeadlessViews` (a test checks).
 */
export const postkitHeadlessViewNames = Object.freeze([
  'Aside',
  'Callout',
  'CardGrid',
  'Disclosure',
  'Gallery',
  'Steps',
  'Diff',
  'FileCard',
  'FileTree',
  'Terminal',
  'AudienceBoundary',
  'Comparison',
  'KeyTakeaway',
  'ProductCard',
  'PullQuote',
  'RelatedContent',
  'SeriesNavigation',
  'SponsorBlock',
  'Stat',
  'AppearsOn',
  'Audio',
  'AuthorCard',
  'CallToAction',
  'Chart',
  'CodeBlock',
  'CodeGroup',
  'Carousel',
  'LinkPreview',
  'NewsletterSignup',
  'Poll',
  'ShareActions',
  'SocialPost',
  'Tabs',
  'Figure',
  'Video',
  'Device',
  'Footnote',
  'Footnotes',
] as const);

/** The name of a component `@postkit/react` has a headless view for. */
export type PostkitHeadlessViewName = (typeof postkitHeadlessViewNames)[number];
