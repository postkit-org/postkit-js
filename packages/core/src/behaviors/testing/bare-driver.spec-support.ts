import type { Behavior } from '../behavior.js';
import { pollUntil, settle, type BehaviorDriver } from './harness.js';

/** Builds a behaviour's DOM once, then re-applies its API on each change. */
export interface BareView<Api> {
  readonly behavior: Behavior<Api>;
  update(api: Api): void;
}

/**
 * A driver that renders a behaviour with plain DOM and `spreadProps`: the
 * shared specs run against the bare machine, with no UI framework.
 */
export function createBareDriver<Fixture, Api>(
  mount: (container: HTMLElement, fixture: Fixture) => BareView<Api>,
): BehaviorDriver<Fixture> {
  let teardown: (() => void) | undefined;
  return {
    async render(fixture) {
      const container = document.createElement('div');
      document.body.append(container);
      const view = mount(container, fixture);
      view.update(view.behavior.api);
      const unsubscribe = view.behavior.subscribe(() =>
        view.update(view.behavior.api),
      );
      view.behavior.start();
      await settle();
      teardown = () => {
        unsubscribe();
        view.behavior.stop();
        container.remove();
      };
      return container;
    },
    async interact(action) {
      action();
      await settle();
    },
    waitFor: (assertion, options) => pollUntil(assertion, options),
    cleanup() {
      teardown?.();
      teardown = undefined;
    },
  };
}

/** Creates an element with optional text. */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
