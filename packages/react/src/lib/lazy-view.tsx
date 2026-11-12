import type { AnyPostkitComponentDefinition } from '@postkit/core/components';
import { createElement, Suspense, use, type FunctionComponent } from 'react';

import type { PostkitAnyComponent } from './config.js';

/** Loads a view on first render: usually `() => import('./carousel.js').then((m) => m.Carousel)`. */
export type PostkitViewLoader = () => Promise<PostkitAnyComponent>;

/** Options for {@link postkitLazyView}. */
export interface PostkitLazyViewOptions {
  /** The component name, for the display name and error messages. */
  readonly name?: string;
  /**
   * The view's definition, when the loaded view is built with `postkitView`
   * or `postkitChakraView`. `createPostkit` then treats the lazy view like the
   * view itself: it reads site defaults and part overrides from the provider.
   */
  readonly definition?: AnyPostkitComponentDefinition;
  /**
   * Whether the loaded view is built with `postkitView` or
   * `postkitChakraView`, without attaching its definition (which would ship
   * the definition with the lazy view). `createPostkit` then gives it site
   * defaults and part overrides through the provider. A `definition` implies
   * it.
   */
  readonly postkitView?: boolean;
}

/** A view that downloads its implementation the first time it renders. */
export interface PostkitLazyView<
  Props extends object = Record<string, unknown>,
> extends FunctionComponent<Props> {
  /** Starts the download now (on hover, or for the components a page uses). */
  preload(): Promise<PostkitAnyComponent>;
  /** The view's definition, when one was given. */
  readonly definition?: AnyPostkitComponentDefinition;
  /**
   * `true` when the loaded view is built with `postkitView` or
   * `postkitChakraView` (see {@link PostkitLazyViewOptions.postkitView}).
   */
  readonly postkitView: boolean;
}

/**
 * A view whose code loads the first time it renders, so a page only downloads
 * the views its content uses.
 *
 * It renders inside its own `<Suspense fallback={null}>`, on the server and in
 * the browser alike. A streaming or `allReady` server render
 * (`renderToReadableStream`, `renderToPipeableStream`, Next.js) waits for it,
 * so the HTML has the full view; while the
 * browser downloads it, React keeps the server HTML in place and hydrates the
 * view once it arrives, so nothing shifts. A synchronous render
 * (`renderToStaticMarkup`) renders a view that hasn't loaded yet as nothing:
 * call `preload()` first, or use the eager views.
 *
 * ```ts
 * const Carousel = postkitLazyView(
 *   () => import('./carousel.js').then((m) => m.Carousel),
 *   { name: 'Carousel' },
 * );
 * ```
 */
export function postkitLazyView(
  load: PostkitViewLoader,
  options: PostkitLazyViewOptions = {},
): PostkitLazyView {
  const label = options.name ?? 'View';
  let view: PostkitAnyComponent | undefined;
  let pending: Promise<PostkitAnyComponent> | undefined;

  function preload(): Promise<PostkitAnyComponent> {
    if (view) return Promise.resolve(view);
    pending ??= load().then(
      (loaded) => {
        if (!isComponent(loaded)) {
          throw new TypeError(
            `postkitLazyView: the loader for ${label} didn't resolve to a component.`,
          );
        }
        view = loaded;
        return loaded;
      },
      (error: unknown) => {
        // Let a later render try again (a flaky network, a new deployment).
        pending = undefined;
        throw error;
      },
    );
    return pending;
  }

  function PostkitLazyViewContent(props: Record<string, unknown>) {
    const View = view ?? use(preload());
    return createElement(View, props);
  }
  PostkitLazyViewContent.displayName = `PostkitLazyContent(${label})`;

  // The boundary is always there, loaded or not, so the server's markup and
  // the browser's first render have the same shape.
  function PostkitLazy(props: Record<string, unknown>) {
    return createElement(
      Suspense,
      { fallback: null },
      createElement(PostkitLazyViewContent, props),
    );
  }
  PostkitLazy.displayName = `PostkitLazy(${label})`;
  PostkitLazy.preload = preload;
  PostkitLazy.postkitView = Boolean(options.definition ?? options.postkitView);
  if (options.definition) {
    Object.defineProperty(PostkitLazy, 'definition', {
      value: options.definition,
      enumerable: true,
    });
  }
  return PostkitLazy as PostkitLazyView;
}

/** Options for {@link postkitLazyViews}. */
export interface PostkitLazyViewsOptions {
  /**
   * Each view's definition, keyed by name, to attach to its lazy view (see
   * {@link PostkitLazyViewOptions.definition}).
   */
  readonly definitions?: Readonly<
    Partial<Record<string, AnyPostkitComponentDefinition>>
  >;
  /**
   * Whether every loaded view is built with `postkitView` or
   * `postkitChakraView` (see {@link PostkitLazyViewOptions.postkitView}).
   */
  readonly postkitViews?: boolean;
}

/**
 * Lazy views for a map of loaders, keyed by component name. When the loaders
 * load `postkitView` or `postkitChakraView` views, pass
 * `{ postkitViews: true }` so `createPostkit` gives them site defaults and
 * part overrides.
 */
export function postkitLazyViews<Name extends string>(
  loaders: Readonly<Record<Name, PostkitViewLoader>>,
  options: PostkitLazyViewsOptions = {},
): Readonly<Record<Name, PostkitLazyView>> {
  return Object.freeze(
    Object.fromEntries(
      (Object.keys(loaders) as Name[]).map((name) => [
        name,
        postkitLazyView(loaders[name], {
          name,
          definition: options.definitions?.[name],
          postkitView: options.postkitViews,
        }),
      ]),
    ) as Record<Name, PostkitLazyView>,
  );
}

/** Starts loading the given lazy views (names without a lazy view are skipped). */
export function preloadPostkitViews(
  views: Readonly<Record<string, unknown>>,
  names: Iterable<string>,
): Promise<void> {
  const loads: Promise<unknown>[] = [];
  for (const name of names) {
    const view = Object.hasOwn(views, name) ? views[name] : undefined;
    if (isLazyView(view)) loads.push(view.preload());
  }
  return Promise.all(loads).then(() => undefined);
}

function isLazyView(value: unknown): value is PostkitLazyView {
  return (
    typeof value === 'function' &&
    typeof (value as Partial<PostkitLazyView>).preload === 'function'
  );
}

function isComponent(value: unknown): value is PostkitAnyComponent {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value)
  );
}
