/**
 * Behaviour hooks: thin React wrappers over `@postkit/core/behaviors` (03
 * §5.3). Every renderer's view, headless or Chakra, reads its behaviour from
 * these or from the same machines, and both pass the shared behaviour specs.
 */
export {
  useTabs,
  type UseTabsOptions,
  type UseTabsReturn,
} from './use-tabs.js';
export {
  useCarousel,
  type UseCarouselOptions,
  type UseCarouselReturn,
} from './use-carousel.js';
export {
  useCodeCopy,
  type UseCodeCopyOptions,
  type UseCodeCopyReturn,
} from './use-code-copy.js';
export {
  useEmbedConsent,
  type UseEmbedConsentOptions,
  type UseEmbedConsentReturn,
} from './use-embed-consent.js';
export {
  usePoll,
  type UsePollOptions,
  type UsePollReturn,
} from './use-poll.js';
export {
  useNewsletterSignup,
  type UseNewsletterSignupOptions,
  type UseNewsletterSignupReturn,
} from './use-newsletter-signup.js';
export {
  useShareActions,
  type UseShareActionsOptions,
  type UseShareActionsReturn,
} from './use-share-actions.js';
