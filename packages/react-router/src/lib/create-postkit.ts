import {
  createPostkit as createPostkitWithRenderer,
  type CreatePostkitOptions,
  type Postkit,
  type PostkitLinkComponent,
} from '@postkit/react';

import {
  createPostkitReactRouterLink,
  type PostkitReactRouterLinkOptions,
} from './create-postkit-react-router-components.js';

/** `createPostkit` options, with `link` as React Router link options. */
export interface CreatePostkitReactRouterOptions<
  ProviderProps extends object = object,
> extends Omit<CreatePostkitOptions<ProviderProps>, 'link'> {
  /**
   * Options for the React Router link, or a link component to use instead.
   * Defaults to React Router's Link for internal links.
   */
  readonly link?: PostkitReactRouterLinkOptions | PostkitLinkComponent;
}

/**
 * `createPostkit` for React Router (03 §3.1): the same options and result as
 * `createPostkit` from `@postkit/react`, with `link` set to
 * React Router's Link.
 *
 * ```ts
 * import { createPostkit } from '@postkit/react-router';
 * import { article, media } from '@postkit/react/kits';
 * import { chakra } from '@postkit/chakra';
 *
 * export const postkit = createPostkit({ renderer: chakra, kits: [article, media] });
 * ```
 */
export function createPostkit<ProviderProps extends object = object>(
  options: CreatePostkitReactRouterOptions<ProviderProps>,
): Postkit<ProviderProps> {
  const { link, ...rest } = options;
  return createPostkitWithRenderer<ProviderProps>({
    ...rest,
    link:
      typeof link === 'function' ? link : createPostkitReactRouterLink(link),
  });
}
