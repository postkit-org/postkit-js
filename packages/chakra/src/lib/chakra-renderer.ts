import { postkitBuiltInDefinitions } from '@postkit/core/components';
import type {
  PostkitAnyComponent,
  PostkitLinkComponent,
  PostkitRenderer,
} from '@postkit/react';

import {
  createPostkitProseLink,
  postkitProseComponents,
} from './components/prose.js';
import {
  PostkitChakraRendererProvider,
  type PostkitChakraProviderProps,
} from './chakra-renderer-provider.js';
import { postkitMdxComponents } from './mdx-components.js';

export {
  createPostkitDefaultVariantsConfig,
  type PostkitChakraProviderProps,
} from './chakra-renderer-provider.js';

/**
 * The views `@postkit/chakra` exports, keyed by component name: one for every
 * built-in definition. `postkitChakraViewNames` lists the same names without
 * importing the views (the manifest's computed `support.chakra` reads it).
 */
export const postkitChakraViews: Readonly<Record<string, PostkitAnyComponent>> =
  Object.freeze(
    Object.fromEntries(
      Object.keys(postkitBuiltInDefinitions).flatMap((name) =>
        Object.hasOwn(postkitMdxComponents, name)
          ? [
              [
                name,
                postkitMdxComponents[name as keyof typeof postkitMdxComponents],
              ],
            ]
          : [],
      ),
    ),
  );

/** The Chakra renderer type: its provider takes `PostkitProvider`'s props. */
export type PostkitChakraRenderer = PostkitRenderer<PostkitChakraProviderProps>;

/**
 * The Chakra renderer for `createPostkit` (03 §5.2):
 *
 * ```ts
 * import { createPostkit } from '@postkit/react';
 * import { article, media } from '@postkit/react/kits';
 * import { chakra } from '@postkit/chakra';
 *
 * const postkit = createPostkit({ renderer: chakra, kits: [article, media] });
 * // <postkit.Provider system={siteSystem}>…</postkit.Provider>
 * ```
 *
 * Its `Provider` takes `PostkitProvider`'s props (`system`, `preset`,
 * `theme`, resolvers, …). Theme-variant `defaults` (`variant`, `size`,
 * `tone`, …) go into the recipes' `defaultVariants` (D18); the other defaults
 * become view defaults. Every built-in component, `chakra-only` ones
 * included, has a view.
 */
export const chakra: PostkitChakraRenderer = Object.freeze({
  id: 'chakra',
  package: '@postkit/chakra',
  views: postkitChakraViews,
  prose: (link: PostkitLinkComponent) => ({
    ...postkitProseComponents,
    a: createPostkitProseLink(link),
  }),
  Provider: PostkitChakraRendererProvider,
});
