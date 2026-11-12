/*
 * 03 step 9: the email views added for 0.3.0, the `postkitEmailViews` map the
 * manifest's `support.email` is computed from, and `renderEmail` (§6.1).
 */
export { KeyTakeaway, type KeyTakeawayProps } from './views/key-takeaway.js';
export { LinkPreview, type LinkPreviewProps } from './views/link-preview.js';
export { ProductCard, type ProductCardProps } from './views/product-card.js';
export { PullQuote, type PullQuoteProps } from './views/pull-quote.js';
export { Stat, type StatProps } from './views/stat.js';
export { Steps, type StepsProps } from './views/steps.js';
export {
  postkitEmailViews,
  type PostkitEmailView,
  type PostkitEmailViewName,
} from './email-views.js';
export * from './render-email/index.js';
