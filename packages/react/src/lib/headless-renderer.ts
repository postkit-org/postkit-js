import type { PostkitRenderer } from './create-postkit.js';
import type { PostkitHeadlessViewName } from './headless-view-names.js';
import { postkitHeadlessViewLoaders } from './headless-view-loaders.js';
import { postkitLazyViews, type PostkitLazyView } from './lazy-view.js';
import type { PostkitLinkComponent } from './link.js';

/**
 * The headless views as lazy views (`postkitLazyView`), keyed by component
 * name like `postkitHeadlessViews`: each downloads its view the first time it
 * renders. `createPostkit` gives them site defaults and part overrides like
 * the views themselves.
 */
export const postkitHeadlessLazyViews: Readonly<
  Record<PostkitHeadlessViewName, PostkitLazyView>
> = postkitLazyViews(postkitHeadlessViewLoaders, { postkitViews: true });

/**
 * The headless renderer, `createPostkit`'s default: `@postkit/react`'s views
 * and native prose. Each view downloads the first time it renders, so a page
 * ships only the views its content uses.
 *
 * Render with a server render that waits for Suspense (a streaming or
 * `allReady` render: Next.js, React Router, Astro); see `postkitLazyView`.
 * For a synchronous render (`renderToStaticMarkup`), preload the views first
 * (`preloadPostkitViews`) or use `postkitHeadlessEagerRenderer`.
 */
export const postkitHeadlessRenderer: PostkitRenderer = Object.freeze({
  id: 'headless',
  package: '@postkit/react',
  views: postkitHeadlessLazyViews,
  prose: (link: PostkitLinkComponent) => ({ a: link }),
});
