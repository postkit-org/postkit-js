/**
 * `@postkit/react`: headless, styleable React views for Postkit components.
 *
 * Views emit the component anatomy (`data-postkit-component`,
 * `data-postkit-part` and state attributes such as `data-tone`) and no styles.
 *
 * @module
 */
export {
  isPostkitDevelopment,
  postkitPartAttributes,
  postkitStateAttributeName,
  resolvePostkitViewState,
  validatePostkitProps,
  warnPostkitProps,
  type PostkitPartAttributes,
  type PostkitViewState,
  type ResolvePostkitViewStateOptions,
} from './lib/anatomy.js';
export {
  postkitView,
  type PostkitChildrenPropsOf,
  type PostkitPartGetter,
  type PostkitPartOptions,
  type PostkitPartProps,
  type PostkitResolvedViewProps,
  type PostkitRootProps,
  type PostkitViewComponent,
  type PostkitViewContext,
  type PostkitViewOptions,
  type PostkitViewOwnProps,
  type PostkitViewProps,
} from './lib/view.js';
export { Aside, type AsideProps } from './components/aside/aside.js';
export {
  Callout,
  postkitCalloutMarks,
  type CalloutProps,
  type CalloutSlot,
  type CalloutTone,
} from './components/callout/callout.js';
export {
  Figure,
  postkitImageDimension,
  type FigureProps,
  type FigureSlot,
} from './components/figure/figure.js';
export {
  CardGrid,
  type CardGridProps,
  type CardGridSlot,
  type CardItem,
} from './components/card-grid/card-grid.js';
export {
  Disclosure,
  type DisclosureProps,
  type DisclosureSlot,
} from './components/disclosure/disclosure.js';
export {
  Gallery,
  type GalleryItem,
  type GalleryProps,
  type GallerySlot,
} from './components/gallery/gallery.js';
export {
  Steps,
  type StepItem,
  type StepsProps,
  type StepsSlot,
} from './components/steps/steps.js';
export { chakraOnly, type ChakraOnlyComponentName } from './lib/chakra-only.js';
export {
  Diff,
  postkitDiffLines,
  type DiffProps,
  type DiffSlot,
  type PostkitDiffLine,
} from './components/diff/diff.js';
export {
  FileCard,
  postkitFileCardMark,
  type FileCardProps,
  type FileCardSlot,
} from './components/file-card/file-card.js';
export {
  FileTree,
  postkitFileTreeDepth,
  postkitFileTreeItems,
  type FileTreeItem,
  type FileTreeProps,
  type FileTreeSlot,
} from './components/file-tree/file-tree.js';
export {
  Terminal,
  type TerminalProps,
  type TerminalSlot,
} from './components/terminal/terminal.js';
export {
  AudienceBoundary,
  type AudienceBoundaryProps,
  type AudienceBoundarySlot,
} from './components/audience-boundary/audience-boundary.js';
export {
  Comparison,
  postkitComparisonValue,
  type ComparisonItem,
  type ComparisonProps,
  type ComparisonSlot,
} from './components/comparison/comparison.js';
export {
  KeyTakeaway,
  type KeyTakeawayProps,
  type KeyTakeawaySlot,
} from './components/key-takeaway/key-takeaway.js';
export {
  ProductCard,
  type ProductCardProps,
  type ProductCardSlot,
} from './components/product-card/product-card.js';
export {
  PullQuote,
  type PullQuoteProps,
  type PullQuoteSlot,
} from './components/pull-quote/pull-quote.js';
export {
  RelatedContent,
  type RelatedContentItem,
  type RelatedContentProps,
  type RelatedContentSlot,
} from './components/related-content/related-content.js';
export {
  SeriesNavigation,
  postkitSeriesLink,
  type SeriesLink,
  type SeriesNavigationProps,
  type SeriesNavigationSlot,
} from './components/series-navigation/series-navigation.js';
export {
  SponsorBlock,
  type SponsorBlockProps,
  type SponsorBlockSlot,
} from './components/sponsor-block/sponsor-block.js';
export { Stat, type StatProps, type StatSlot } from './components/stat/stat.js';
export {
  AppearsOn,
  type AppearsOnProps,
  type AppearsOnService,
  type AppearsOnSlot,
  type SyndicationReference,
} from './components/appears-on/appears-on.js';
export {
  Audio,
  type AudioProps,
  type AudioSlot,
} from './components/audio/audio.js';
export {
  AuthorCard,
  type AuthorCardProps,
  type AuthorCardSlot,
  type AuthorLink,
} from './components/author-card/author-card.js';
export {
  CallToAction,
  type CallToActionProps,
  type CallToActionSlot,
} from './components/call-to-action/call-to-action.js';
export {
  Chart,
  postkitChartColors,
  postkitChartLayout,
  type ChartDatum,
  type ChartProps,
  type ChartSeries,
  type ChartSlot,
  type PostkitChartLayout,
  type PostkitChartLayoutSeries,
  type PostkitChartMark,
} from './components/chart/chart.js';
export {
  Video,
  type VideoProps,
  type VideoSlot,
  type VideoTrack,
} from './components/video/video.js';
export {
  Device,
  type DeviceKind,
  type DeviceProps,
  type DeviceSlot,
} from './components/device/device.js';
export * from './hooks/index.js';
export * from './components/interactive.js';
export * from './lib/create-postkit.js';
export * from './components/footnote/footnote.js';
export * from './components/footnote/footnote-model.js';
export * from './components/footnotes/footnotes.js';
export * from './components/sidenote/sidenote.js';
