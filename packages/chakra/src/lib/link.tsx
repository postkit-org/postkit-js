/*
 * Links are renderer-neutral, so they live in `@postkit/react` (which
 * `createPostkit` uses for every renderer). Re-exported for 0.x imports.
 */
export {
  createPostkitLink,
  isPostkitInternalHref,
  type CreatePostkitLinkOptions,
  type PostkitInternalHrefMatcher,
  type PostkitLinkAdapter,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from '@postkit/react';
