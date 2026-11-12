import {
  postkitShareServices,
  type ShareRequest,
  type ShareService,
} from '@postkit/core/behaviors';
import type { ReactNode } from 'react';

export type PostkitShareRequest = ShareRequest;

export interface PostkitSocialService extends ShareService {
  readonly icon?: ReactNode;
  /**
   * Text colour for the service's label. Use a mode-aware semantic token
   * (`blue.fg`, `fg`) so the label keeps 4.5:1 in light and dark.
   */
  readonly accent?: string;
}

export type PostkitSocialServiceRegistry = Readonly<
  Record<string, PostkitSocialService>
>;

/** Each service's label colour, as a mode-aware semantic token. */
const accents: Readonly<Record<string, string>> = {
  bluesky: 'blue.fg',
  facebook: 'blue.fg',
  instagram: 'pink.fg',
  linegraph: 'purple.fg',
  linkedin: 'blue.fg',
  mastodon: 'purple.fg',
  medium: 'fg',
  threads: 'fg',
  tiktok: 'fg',
  x: 'fg',
  youtube: 'red.fg',
};

/**
 * Postkit's built-in services: the labels and share URLs from
 * `postkitShareServices` in `@postkit/core/behaviors`, with Chakra accents.
 */
export const postkitDefaultSocialServices: PostkitSocialServiceRegistry =
  Object.freeze(
    Object.fromEntries(
      Object.entries(postkitShareServices).map(([id, service]) => [
        id,
        accents[id] ? { ...service, accent: accents[id] } : service,
      ]),
    ),
  );

export function mergePostkitSocialServices(
  overrides: PostkitSocialServiceRegistry = {},
): PostkitSocialServiceRegistry {
  return Object.freeze({
    ...postkitDefaultSocialServices,
    ...overrides,
  });
}
