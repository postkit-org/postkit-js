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
  chakraOnly,
  type PostkitChakraOnlyComponent,
} from './lib/chakra-only.js';
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
