import {
  createPostkit as createPostkitWithRenderer,
  type CreatePostkitOptions,
  type Postkit,
  type PostkitLinkComponent,
} from '@postkit/react';

import {
  createPostkitTanStackRouterLink,
  type PostkitTanStackRouterLinkOptions,
} from './create-postkit-tanstack-router-components.js';

/** `createPostkit` options, with `link` as TanStack Router link options. */
export interface CreatePostkitTanStackRouterOptions<
  ProviderProps extends object = object,
> extends Omit<CreatePostkitOptions<ProviderProps>, 'link'> {
  /**
   * Options for the TanStack Router link, or a link component to use instead.
   * Defaults to TanStack Router's Link for internal links.
   */
  readonly link?: PostkitTanStackRouterLinkOptions | PostkitLinkComponent;
}

/**
 * `createPostkit` for TanStack Router (03 §3.1): the same options and result as
 * `createPostkit` from `@postkit/react`, with `link` set to
 * TanStack Router's Link.
 *
 * ```ts
 * import { createPostkit } from '@postkit/tanstack-router';
 * import { article, media } from '@postkit/react/kits';
 * import { chakra } from '@postkit/chakra';
 *
 * export const postkit = createPostkit({ renderer: chakra, kits: [article, media] });
 * ```
 */
export function createPostkit<ProviderProps extends object = object>(
  options: CreatePostkitTanStackRouterOptions<ProviderProps>,
): Postkit<ProviderProps> {
  const { link, ...rest } = options;
  return createPostkitWithRenderer<ProviderProps>({
    ...rest,
    link:
      typeof link === 'function' ? link : createPostkitTanStackRouterLink(link),
  });
}
