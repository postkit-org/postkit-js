/**
 * Browser features the behaviours rely on that jsdom lacks: animation frames,
 * `CSS.escape`, resize and intersection observers, element scrolling and
 * layout. In jsdom, {@link installBehaviorEnvironment} supplies them, with a
 * simple layout for carousels (each slide as wide as the viewport, side by
 * side) so scroll snapping and slide visibility behave as in a browser. In a
 * real browser it changes nothing.
 */

const SLIDE_WIDTH = 320;
const SLIDE_HEIGHT = 240;
const ITEM_GROUP = '[data-scope="carousel"][data-part="item-group"]';
const ITEM = '[data-scope="carousel"][data-part="item"]';

type BrowserWindow = Window & typeof globalThis;

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  toJSON(): unknown;
}

function rect(left: number, top: number, width: number, height: number): Rect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return { left, top, width, height };
    },
  };
}

/** True in jsdom, where layout and observers need emulating. */
export function isEmulatedDom(win: Window): boolean {
  return /jsdom/i.test(win.navigator.userAgent);
}

/**
 * Installs the emulation into `win` when it is jsdom. Returns a function that
 * restores everything it replaced.
 */
export function installBehaviorEnvironment(
  win: Window = globalThis.window,
): () => void {
  if (!win || !isEmulatedDom(win)) return () => undefined;
  const target = win as BrowserWindow & Record<string, unknown>;
  const restores: VoidFunction[] = [];

  const define = (
    owner: object,
    key: string,
    descriptor: PropertyDescriptor,
  ) => {
    const previous = Object.getOwnPropertyDescriptor(owner, key);
    Object.defineProperty(owner, key, { configurable: true, ...descriptor });
    restores.push(() => {
      if (previous) Object.defineProperty(owner, key, previous);
      else delete (owner as Record<string, unknown>)[key];
    });
  };

  // Test runners such as Vitest copy window globals onto `globalThis`; patch
  // both so every lookup sees the emulation.
  const owners = [...new Set<object>([target, globalThis])];
  const defineGlobal = (key: string, value: unknown) => {
    for (const owner of owners) define(owner, key, { writable: true, value });
  };

  // jsdom runs a frame's callbacks in one task; browsers run microtasks
  // between callbacks, which Zag's deferred events rely on.
  defineGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    target.setTimeout(() => callback(target.performance.now()), 0),
  );
  defineGlobal('cancelAnimationFrame', (id: number) => target.clearTimeout(id));

  if (typeof target.CSS?.escape !== 'function') {
    defineGlobal('CSS', {
      ...(target.CSS ?? {}),
      escape: (value: string) =>
        String(value).replace(
          /[^a-zA-Z0-9_-]/g,
          (character) => `\\${character}`,
        ),
    });
  }

  if (typeof target.ResizeObserver !== 'function') {
    defineGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {
          return undefined;
        }
        unobserve() {
          return undefined;
        }
        disconnect() {
          return undefined;
        }
      },
    );
  }

  // Carousel layout: an item group is one slide wide; slides sit side by side.
  const elementPrototype = target.Element.prototype;
  const htmlPrototype = target.HTMLElement.prototype;
  const scrollPositions = new WeakMap<Element, number>();
  const isItemGroup = (element: Element) => element.matches(ITEM_GROUP);
  const itemCount = (group: Element) => group.querySelectorAll(ITEM).length;
  const originalRect = elementPrototype.getBoundingClientRect;
  const originalScrollLeft = Object.getOwnPropertyDescriptor(
    elementPrototype,
    'scrollLeft',
  );
  const scrollLeftOf = (element: Element) => scrollPositions.get(element) ?? 0;
  const scrollGroupTo = (group: Element, left: number) => {
    const max = Math.max(0, (itemCount(group) - 1) * SLIDE_WIDTH);
    const next = Math.min(max, Math.max(0, left));
    if (next === scrollLeftOf(group)) return;
    scrollPositions.set(group, next);
    group.dispatchEvent(new target.Event('scroll'));
  };

  define(elementPrototype, 'getBoundingClientRect', {
    writable: true,
    value(this: Element) {
      if (isItemGroup(this)) return rect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
      if (this.matches(ITEM)) {
        const group = this.closest(ITEM_GROUP);
        const index = Number(this.getAttribute('data-index') ?? '0');
        const offset = group ? scrollLeftOf(group) : 0;
        return rect(index * SLIDE_WIDTH - offset, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
      }
      return originalRect.call(this);
    },
  });
  define(elementPrototype, 'scrollLeft', {
    get(this: Element) {
      if (isItemGroup(this)) return scrollLeftOf(this);
      return originalScrollLeft?.get?.call(this) ?? 0;
    },
    set(this: Element, value: number) {
      if (isItemGroup(this)) scrollGroupTo(this, value);
      else originalScrollLeft?.set?.call(this, value);
    },
  });
  for (const [key, value] of [
    ['offsetWidth', SLIDE_WIDTH],
    ['clientWidth', SLIDE_WIDTH],
    ['offsetHeight', SLIDE_HEIGHT],
    ['clientHeight', SLIDE_HEIGHT],
  ] as const) {
    const original =
      Object.getOwnPropertyDescriptor(htmlPrototype, key) ??
      Object.getOwnPropertyDescriptor(elementPrototype, key);
    define(htmlPrototype, key, {
      get(this: HTMLElement) {
        if (isItemGroup(this) || this.matches(ITEM)) return value;
        return original?.get?.call(this) ?? 0;
      },
    });
  }
  const originalScrollWidth = Object.getOwnPropertyDescriptor(
    elementPrototype,
    'scrollWidth',
  );
  define(elementPrototype, 'scrollWidth', {
    get(this: Element) {
      if (isItemGroup(this)) return itemCount(this) * SLIDE_WIDTH;
      return originalScrollWidth?.get?.call(this) ?? 0;
    },
  });
  const scrollTo = function (
    this: Element,
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    const left =
      typeof options === 'number' ? options : (options?.left ?? undefined);
    if (left !== undefined && isItemGroup(this)) scrollGroupTo(this, left);
    void y;
  };
  define(elementPrototype, 'scrollTo', { writable: true, value: scrollTo });
  define(elementPrototype, 'scroll', { writable: true, value: scrollTo });
  define(elementPrototype, 'scrollBy', {
    writable: true,
    value(this: Element, options?: ScrollToOptions | number) {
      const delta =
        typeof options === 'number' ? options : (options?.left ?? 0);
      if (isItemGroup(this)) scrollGroupTo(this, scrollLeftOf(this) + delta);
    },
  });

  if (typeof target.IntersectionObserver !== 'function') {
    const observers = new Set<{ disconnect(): void }>();
    class LayoutIntersectionObserver {
      readonly root: Element | null;
      readonly rootMargin = '0px';
      readonly thresholds: readonly number[];
      private readonly targets = new Map<Element, boolean | undefined>();
      private timer: number | undefined;
      private readonly onScroll = () => this.schedule();

      constructor(
        private readonly callback: IntersectionObserverCallback,
        options: IntersectionObserverInit = {},
      ) {
        this.root = (options.root as Element | null | undefined) ?? null;
        const threshold = options.threshold ?? 0;
        this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
        this.root?.addEventListener('scroll', this.onScroll);
        observers.add(this);
      }

      observe(element: Element) {
        this.targets.set(element, undefined);
        this.schedule();
      }

      unobserve(element: Element) {
        this.targets.delete(element);
      }

      disconnect() {
        this.targets.clear();
        this.root?.removeEventListener('scroll', this.onScroll);
        if (this.timer !== undefined) target.clearTimeout(this.timer);
        observers.delete(this);
      }

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }

      private schedule() {
        if (this.timer !== undefined) return;
        this.timer = target.setTimeout(() => {
          this.timer = undefined;
          this.report();
        }, 0);
      }

      private report() {
        const rootBounds = this.root
          ? this.root.getBoundingClientRect()
          : rect(0, 0, target.innerWidth, target.innerHeight);
        const threshold = Math.max(...this.thresholds, 0);
        const entries: IntersectionObserverEntry[] = [];
        for (const [element, previous] of this.targets) {
          const bounds = element.getBoundingClientRect();
          const visible = Math.max(
            0,
            Math.min(bounds.right, rootBounds.right) -
              Math.max(bounds.left, rootBounds.left),
          );
          const ratio = bounds.width > 0 ? visible / bounds.width : 0;
          const isIntersecting = visible > 0 && ratio >= threshold;
          if (previous === isIntersecting) continue;
          this.targets.set(element, isIntersecting);
          entries.push({
            target: element,
            isIntersecting,
            intersectionRatio: ratio,
            boundingClientRect: bounds,
            intersectionRect: bounds,
            rootBounds,
            time: target.performance.now(),
          } as IntersectionObserverEntry);
        }
        if (entries.length > 0) {
          this.callback(entries, this as unknown as IntersectionObserver);
        }
      }
    }
    defineGlobal('IntersectionObserver', LayoutIntersectionObserver);
    restores.push(() => observers.forEach((observer) => observer.disconnect()));
  }

  return () => {
    for (const restore of restores.reverse()) restore();
  };
}

/** A stand-in for `navigator.clipboard` that records what was written. */
export interface ClipboardStub {
  readonly writes: readonly string[];
  restore(): void;
}

/** Replaces `navigator.clipboard` with a recorder until `restore` is called. */
export function installClipboardStub(
  win: Window = globalThis.window,
): ClipboardStub {
  const writes: string[] = [];
  const navigator = win.navigator;
  const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        writes.push(text);
      },
    },
  });
  return {
    writes,
    restore() {
      if (previous) Object.defineProperty(navigator, 'clipboard', previous);
      else
        delete (navigator as unknown as Record<string, unknown>)['clipboard'];
    },
  };
}
