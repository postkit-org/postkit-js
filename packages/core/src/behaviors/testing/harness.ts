/**
 * What a renderer implements to run a shared behaviour spec. A spec renders a
 * fixture, interacts through DOM events and reads state from the DOM (ARIA
 * and `data-*` attributes, roles and text), so the same spec checks the bare
 * machine, `@postkit/chakra`, the headless `@postkit/react` and, later,
 * custom elements.
 */
export interface BehaviorDriver<Fixture> {
  /**
   * Renders `fixture` into the document and returns the element that
   * contains it. Resolve once the behaviour has started.
   */
  render(fixture: Fixture): Element | Promise<Element>;
  /**
   * Runs a user interaction (a DOM event, a focus change) and resolves once
   * the renderer has applied the resulting updates. A React driver wraps it in
   * `act`.
   */
  interact(action: () => void): Promise<void>;
  /**
   * Retries `assertion` until it stops throwing or `timeout` (ms) passes, then
   * rethrows. Testing Library's `waitFor`, or {@link pollUntil}.
   */
  waitFor(
    assertion: () => void,
    options?: { readonly timeout?: number },
  ): Promise<void>;
  /** Unmounts everything `render` created. */
  cleanup(): void | Promise<void>;
}

/** One behaviour check. */
export interface BehaviorSpecCase {
  readonly name: string;
  run(): Promise<void>;
}

/** A behaviour's shared spec: the checks every renderer must pass. */
export interface BehaviorSpec {
  readonly behavior: string;
  readonly cases: readonly BehaviorSpecCase[];
}

/** The parts of a test runner a spec needs (Vitest, Jest, `node:test`…). */
export interface BehaviorSpecRunner {
  describe(name: string, body: () => void): void;
  it(name: string, body: () => Promise<void>, timeout?: number): void;
}

/** Registers each case of `spec` with a test runner. */
export function registerBehaviorSpec(
  spec: BehaviorSpec,
  runner: BehaviorSpecRunner,
  options: { readonly label?: string; readonly timeout?: number } = {},
): void {
  runner.describe(
    options.label ? `${spec.behavior} (${options.label})` : spec.behavior,
    () => {
      for (const specCase of spec.cases) {
        runner.it(
          specCase.name,
          () => specCase.run(),
          options.timeout ?? 10_000,
        );
      }
    },
  );
}

/** Thrown when a behaviour check fails. */
export class BehaviorAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BehaviorAssertionError';
  }
}

/** Fails the check with `message` unless `condition` holds. */
export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new BehaviorAssertionError(message);
}

/** Fails the check unless `actual` and `expected` are identical. */
export function checkEqual<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new BehaviorAssertionError(
      `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

/** A {@link BehaviorDriver.waitFor} for drivers without one. */
export async function pollUntil(
  assertion: () => void,
  {
    timeout = 2000,
    interval = 10,
  }: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

/** Waits for pending microtasks and one macrotask. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function view(element: Element): Window & typeof globalThis {
  const win = element.ownerDocument.defaultView;
  check(win, 'The rendered element is not attached to a window.');
  return win as Window & typeof globalThis;
}

/** Clicks `element` as a pointer would. */
export function click(element: Element): void {
  element.dispatchEvent(
    new (view(element).MouseEvent)('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
  );
}

/** Presses `key` on `element`, which should have focus. */
export function keyDown(element: Element, key: string): void {
  element.dispatchEvent(
    new (view(element).KeyboardEvent)('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Text a reader sees: `element`'s text without `hidden` or `aria-hidden` parts. */
export function visibleText(element: Element): string {
  if (element.hasAttribute('hidden')) return '';
  let text = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) text += node.textContent ?? '';
    else if (node.nodeType === 1) text += visibleText(node as Element);
  }
  return text.replace(/\s+/g, ' ').trim();
}

/** The element `id` names, in `root`'s document. */
export function byId(root: Element, id: string | null): HTMLElement | null {
  return id ? root.ownerDocument.getElementById(id) : null;
}

/** The accessible name from `aria-label`, `aria-labelledby` or visible text. */
export function accessibleName(element: Element): string {
  const label = element.getAttribute('aria-label');
  if (label) return label.trim();
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => {
        const target = byId(element, id);
        return target ? visibleText(target) : '';
      })
      .join(' ')
      .trim();
  }
  return visibleText(element);
}
