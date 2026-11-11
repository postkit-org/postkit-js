import { postkitBuiltInDefinitions } from '@postkit/core/components';
import {
  postkitLazyViews,
  type PostkitLazyView,
  type PostkitLinkComponent,
} from '@postkit/react';

import type { PostkitChakraRenderer } from './chakra-renderer.js';
import { PostkitChakraRendererProvider } from './chakra-renderer-provider.js';
import {
  createPostkitProseLink,
  postkitProseComponents,
} from './components/prose.js';
import {
  postkitChakraViewLoaders,
  type PostkitChakraViewName,
} from './view-loaders.js';

/**
 * The Chakra views as lazy views (`postkitLazyView`), keyed by component
 * name like `postkitChakraViews`: each downloads its view the first time it
 * renders. They carry their definitions, so `createPostkit` gives them site
 * defaults and part overrides like the views themselves.
 */
export const postkitChakraLazyViews: Readonly<
  Record<PostkitChakraViewName, PostkitLazyView>
> = postkitLazyViews(postkitChakraViewLoaders, postkitBuiltInDefinitions);

/**
 * The Chakra renderer with lazy views, for `createPostkit`: the same id,
 * provider, prose and manifest support as `chakra`, but each view downloads
 * the first time it renders instead of shipping with every page.
 *
 * ```ts
 * import { createPostkit } from '@postkit/next';
 * import { chakraLazy } from '@postkit/chakra';
 *
 * export const postkit = createPostkit({ renderer: chakraLazy, kits: [article] });
 * ```
 */
export const chakraLazy: PostkitChakraRenderer = Object.freeze({
  id: 'chakra',
  package: '@postkit/chakra',
  views: postkitChakraLazyViews,
  prose: (link: PostkitLinkComponent) => ({
    ...postkitProseComponents,
    a: createPostkitProseLink(link),
  }),
  Provider: PostkitChakraRendererProvider,
});
