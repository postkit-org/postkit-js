/**
 * Framework-free behaviours for Postkit's interactive components: carousel
 * paging, tabs, code copy, embed consent, poll voting, newsletter signup and
 * share actions. Renderers (React hooks, custom elements) are thin wrappers
 * over these.
 *
 * Carousel, tabs and code copy are Zag machines configured as
 * `@postkit/chakra` configures them (decision D7); embed consent, the poll,
 * newsletter signup and share actions are plain TypeScript. The `@zag-js/*`
 * packages are optional peer dependencies at the range Chakra resolves, so a
 * Chakra host bundles one copy.
 *
 * @packageDocumentation
 */
export {
  clampIndex,
  createMachineBehavior,
  type Behavior,
  type MachineBehavior,
  type MachineSchemaOf,
} from './behavior.js';
export { normalizeProps, spreadProps, type DomPropTypes } from './dom.js';
export { createMachineService, type MachineService } from './runtime.js';
export {
  carouselMachine,
  carouselProps,
  connectCarousel,
  createCarousel,
  postkitCarouselConfig,
  postkitCarouselPeekConfig,
  carouselItemSnapAlign,
  type CarouselPresentation,
  type CarouselBehavior,
  type CarouselBehaviorApi,
  type CarouselBehaviorOptions,
} from './carousel/carousel.behavior.js';
export {
  connectTabs,
  createTabs,
  postkitTabsConfig,
  tabsMachine,
  tabsProps,
  type TabsBehavior,
  type TabsBehaviorApi,
  type TabsBehaviorOptions,
} from './tabs/tabs.behavior.js';
export {
  codeCopyMachine,
  codeCopyProps,
  connectCodeCopy,
  createCodeCopy,
  postkitCodeCopyConfig,
  type CodeCopyBehavior,
  type CodeCopyBehaviorApi,
  type CodeCopyBehaviorOptions,
} from './code-copy/code-copy.behavior.js';
export {
  connectEmbedConsent,
  createEmbedConsent,
  embedConsentInitialState,
  embedConsentTransition,
  type EmbedConsentActivation,
  type EmbedConsentApi,
  type EmbedConsentBehavior,
  type EmbedConsentBehaviorOptions,
  type EmbedConsentEvent,
  type EmbedConsentNormalizer,
  type EmbedConsentService,
  type EmbedConsentState,
} from './embed-consent/embed-consent.behavior.js';
export {
  connectPoll,
  createPoll,
  pollInitialState,
  pollStatus,
  pollTotal,
  pollTransition,
  type PollApi,
  type PollBehavior,
  type PollBehaviorOptions,
  type PollContext,
  type PollEvent,
  type PollNormalizer,
  type PollOption,
  type PollResult,
  type PollService,
  type PollState,
} from './poll/poll.behavior.js';
export {
  connectNewsletterSignup,
  createNewsletterSignup,
  newsletterSignupInitialState,
  newsletterSignupSubmittingMessage,
  newsletterSignupTransition,
  newsletterSignupUnconfiguredMessage,
  type NewsletterSignupApi,
  type NewsletterSignupBehavior,
  type NewsletterSignupBehaviorOptions,
  type NewsletterSignupConfig,
  type NewsletterSignupContext,
  type NewsletterSignupEvent,
  type NewsletterSignupNormalizer,
  type NewsletterSignupService,
  type NewsletterSignupState,
  type NewsletterSignupStatus,
  type NewsletterSubscribe,
  type NewsletterSubscription,
  type NewsletterSubscriptionResult,
} from './newsletter-signup/newsletter-signup.behavior.js';
export {
  connectShareActions,
  createShareActions,
  mergeShareServices,
  postkitDefaultShareServiceIds,
  postkitShareServices,
  shareActionsCopiedMessage,
  shareActionsInitialState,
  shareActionsTransition,
  shareWithService,
  type ShareActionsApi,
  type ShareActionsBehavior,
  type ShareActionsBehaviorOptions,
  type ShareActionsContext,
  type ShareActionsEvent,
  type ShareActionsNormalizer,
  type ShareActionsService,
  type ShareActionsState,
  type ShareEnvironment,
  type ShareRequest,
  type ShareService,
  type ShareServiceRegistry,
  type ShareWithServiceOptions,
} from './share-actions/share-actions.behavior.js';
