import {
  createPostkit as createPostkitWithRenderer,
  type CreatePostkitOptions,
  type Postkit,
  type PostkitLinkComponent,
} from '@postkit/react';

import {
  createPostkitNextLink,
  type PostkitNextLinkOptions,
} from './create-postkit-next-components.js';

/** `createPostkit` options, with `link` as Next.js link options. */
export interface CreatePostkitNextOptions<
  ProviderProps extends object = object,
> extends Omit<CreatePostkitOptions<ProviderProps>, 'link'> {
  /**
   * Options for the Next.js link, or a link component to use instead.
   * Defaults to next/link for internal links.
   */
  readonly link?: PostkitNextLinkOptions | PostkitLinkComponent;
}

/**
 * `createPostkit` for Next.js (03 §3.1): the same options and result as
 * `createPostkit` from `@postkit/react`, with `link` set to
 * next/link.
 *
 * ```ts
 * import { createPostkit } from '@postkit/next';
 * import { article, media } from '@postkit/react/kits';
 * import { chakra } from '@postkit/chakra';
 *
 * export const postkit = createPostkit({ renderer: chakra, kits: [article, media] });
 * ```
 */
export function createPostkit<ProviderProps extends object = object>(
  options: CreatePostkitNextOptions<ProviderProps>,
): Postkit<ProviderProps> {
  const { link, ...rest } = options;
  return createPostkitWithRenderer<ProviderProps>({
    ...rest,
    link: typeof link === 'function' ? link : createPostkitNextLink(link),
  });
}
