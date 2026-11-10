/**
 * Framework-free behaviours for Postkit's interactive components: carousel
 * paging, tabs, code copy and embed consent. Renderers (React hooks, custom
 * elements) are thin wrappers over these.
 *
 * Carousel, tabs and code copy are Zag machines configured as
 * `@postkit/chakra` configures them (decision D7); embed consent is plain
 * TypeScript. The `@zag-js/*` packages are optional peer dependencies at the
 * range Chakra resolves, so a Chakra host bundles one copy.
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
