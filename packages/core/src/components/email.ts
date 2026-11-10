/*
 * Email support (03 §6). A component is `supported` in email when
 * `@postkit/email` exports a view for its definition. Otherwise the email
 * renderer applies the fallback the definition declares.
 */

/**
 * What `renderEmail` does with a component that has no email view:
 *
 * - `text`: its static view (the markup `serializePostkitHtml` writes) as
 *   email-safe prose, so its words, links, images and code survive.
 * - `link`: a link to it on the web, for content that only works there (a
 *   poll, an embedded post).
 * - `omit`: it's left out, for controls with no meaning in an inbox (share
 *   buttons, a signup form the reader has already used).
 */
export type PostkitEmailFallback = 'link' | 'omit' | 'text';

/** The email fallbacks, for validation. */
export const postkitEmailFallbacks: readonly PostkitEmailFallback[] =
  Object.freeze(['link', 'omit', 'text']);

/** A definition's email declaration: its fallback when there's no view. */
export interface PostkitComponentEmailDefinition {
  readonly fallback: PostkitEmailFallback;
}

/**
 * A component's email support in a v2 manifest: `supported` when
 * `@postkit/email` exports a view for it, the definition's declared fallback
 * otherwise, and `not-supported` for a component with neither.
 */
export type PostkitEmailSupport =
  'not-supported' | 'supported' | { readonly fallback: PostkitEmailFallback };
