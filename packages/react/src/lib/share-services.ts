import { mergeShareServices, type ShareService } from '@postkit/core/behaviors';
import type { ReactNode } from 'react';

/** A share or social service for the headless views: a label and an icon. */
export interface PostkitShareService extends ShareService {
  /** Shown before the label; otherwise the label's first letter is. */
  readonly icon?: ReactNode;
}

/** Services by id, merged over Postkit's built-in ones. */
export type PostkitShareServiceRegistry = Readonly<
  Record<string, PostkitShareService>
>;

/**
 * Merges a host's services over Postkit's built-in share services
 * (`postkitShareServices` in `@postkit/core/behaviors`).
 */
export function postkitShareServiceRegistry(
  overrides?: PostkitShareServiceRegistry,
): PostkitShareServiceRegistry {
  return mergeShareServices(overrides);
}
