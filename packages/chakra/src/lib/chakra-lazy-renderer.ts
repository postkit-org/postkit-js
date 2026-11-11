import type { PostkitLinkComponent } from '@postkit/react';

import type { PostkitChakraRenderer } from './chakra-renderer.js';
import { PostkitChakraRendererProvider } from './chakra-renderer-provider.js';
import { postkitChakraLazyViews } from './chakra-lazy-views.js';
import {
  createPostkitProseLink,
  postkitProseComponents,
} from './components/prose.js';

export { postkitChakraLazyViews } from './chakra-lazy-views.js';

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
