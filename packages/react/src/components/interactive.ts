/**
 * Headless views for the interactive built-in components (03 §8 step 6).
 * Each reads its behaviour from a hook over `@postkit/core/behaviors` and
 * passes the same shared behaviour specs as its `@postkit/chakra` view.
 */
export {
  Carousel,
  type CarouselItem,
  type CarouselProps,
  type CarouselSlot,
} from './carousel/carousel.js';
export {
  Tabs,
  type TabItem,
  type TabsProps,
  type TabsSlot,
} from './tabs/tabs.js';
export {
  CodeBlock,
  postkitHighlightedLines,
  type CodeBlockProps,
  type CodeBlockSlot,
} from './code-block/code-block.js';
export {
  CodeGroup,
  type CodeGroupItem,
  type CodeGroupProps,
  type CodeGroupSlot,
} from './code-group/code-group.js';
export {
  LinkPreview,
  type LinkPreviewPresentation,
  type LinkPreviewProps,
  type LinkPreviewSlot,
} from './link-preview/link-preview.js';
export {
  SocialPost,
  type SocialPostMetadata,
  type SocialPostProps,
  type SocialPostSlot,
} from './social-post/social-post.js';
export {
  Poll,
  type PollOption,
  type PollProps,
  type PollSlot,
} from './poll/poll.js';
export {
  NewsletterSignup,
  type NewsletterSignupConfig,
  type NewsletterSignupProps,
  type NewsletterSignupSlot,
} from './newsletter-signup/newsletter-signup.js';
export {
  ShareActions,
  type PostkitShareService,
  type PostkitShareServiceRegistry,
  type ShareActionsProps,
  type ShareActionsSlot,
  type ShareRequest,
} from './share-actions/share-actions.js';
export type {
  PostkitSocialServiceLabel,
  PostkitSocialServiceLabels,
} from '../lib/social-service-labels.js';
