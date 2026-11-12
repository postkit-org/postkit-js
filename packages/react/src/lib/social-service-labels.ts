import {
  postkitShareServiceRegistry,
  type PostkitShareService,
  type PostkitShareServiceRegistry,
} from './share-services.js';

/**
 * How a headless view labels a social service: its label and optional icon.
 * The same shape as a share service, so one `socialServices` registry serves
 * `ShareActions`, `SocialPost` and `LinkPreview`.
 */
export type PostkitSocialServiceLabel = PostkitShareService;

/** Service labels keyed by service id (`bluesky`, `x`, …). */
export type PostkitSocialServiceLabels = PostkitShareServiceRegistry;

/**
 * The built-in services (`postkitShareServices` in `@postkit/core/behaviors`,
 * the labels `@postkit/chakra`'s `PostkitProvider` registers too) with
 * `overrides` layered over them, so both renderers name a service the same
 * way.
 *
 * @internal
 */
export function postkitSocialServiceLabels(
  overrides?: PostkitSocialServiceLabels,
): PostkitSocialServiceLabels {
  return postkitShareServiceRegistry(overrides);
}
