import type { PostkitLazyView } from '@postkit/react';
import type { ComponentProps } from 'react';

import {
  createPostkitProseLink,
  postkitProseComponents,
  type ProseComponents,
} from './components/prose.js';
import { createPostkitLink, type PostkitLinkProps } from './link.js';
import type {
  CreatePostkitMdxComponentsOptions,
  PostkitMdxComponents,
} from './mdx-components.js';
import { postkitChakraLazyViews } from './chakra-lazy-views.js';
import type { PostkitChakraViewName } from './view-loaders.js';

/** `postkitMdxComponents` with lazy views: prose stays as it is. */
export type PostkitLazyMdxComponents = ProseComponents & {
  readonly [Name in PostkitChakraViewName]: PostkitLazyView<
    ComponentProps<PostkitMdxComponents[Name]>
  >;
};

/** `createPostkitLazyMdxComponents`'s result: `components` override the map. */
export type PostkitLazyMdxComponentMap<TComponents extends object = object> =
  Omit<PostkitLazyMdxComponents, keyof TComponents> & TComponents;

/**
 * `createPostkitMdxComponents` with lazy views: the same keys and options,
 * but each component view downloads the first time a document renders it,
 * so a page only ships the views its content uses. Prose (`p`, headings,
 * code fences, `a` with the site link) loads with the map.
 *
 * Render it with a server render that waits for Suspense (a streaming or
 * `allReady` render, as Next.js does); see `postkitLazyView`.
 */
export function createPostkitLazyMdxComponents<
  TComponents extends object = object,
  TLinkProps extends object = PostkitLinkProps,
>(
  options: CreatePostkitMdxComponentsOptions<TComponents, TLinkProps> = {},
): PostkitLazyMdxComponentMap<TComponents> {
  const link =
    typeof options.link === 'function'
      ? options.link
      : createPostkitLink(options.link);

  return {
    ...postkitProseComponents,
    ...postkitChakraLazyViews,
    a: createPostkitProseLink(link),
    ...options.components,
  } as unknown as PostkitLazyMdxComponentMap<TComponents>;
}
