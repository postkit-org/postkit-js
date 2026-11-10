/**
 * The shared behaviour specs. Every renderer of Postkit's interactive
 * components runs these against its own components through a
 * {@link BehaviorDriver}: the bare machines in `@postkit/core`, then
 * `@postkit/chakra`, the headless `@postkit/react` and, later, custom
 * elements. The specs have no test-runner dependency;
 * {@link registerBehaviorSpec} hands their cases to Vitest, Jest or
 * `node:test`.
 *
 * @packageDocumentation
 */
export {
  accessibleName,
  BehaviorAssertionError,
  byId,
  check,
  checkEqual,
  click,
  keyDown,
  pollUntil,
  registerBehaviorSpec,
  settle,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
  type BehaviorSpecCase,
  type BehaviorSpecRunner,
} from './harness.js';
export {
  installBehaviorEnvironment,
  installClipboardStub,
  isEmulatedDom,
  type ClipboardStub,
} from './environment.js';
export {
  carouselBehaviorSpec,
  type CarouselBehaviorFixture,
} from '../carousel/carousel.behavior.spec-suite.js';
export {
  codeCopyBehaviorSpec,
  type CodeCopyBehaviorFixture,
} from '../code-copy/code-copy.behavior.spec-suite.js';
export {
  embedConsentBehaviorSpec,
  type EmbedConsentBehaviorFixture,
} from '../embed-consent/embed-consent.behavior.spec-suite.js';
export {
  tabsBehaviorSpec,
  type TabsBehaviorFixture,
} from '../tabs/tabs.behavior.spec-suite.js';
