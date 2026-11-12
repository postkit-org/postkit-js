import {
  defaultSystem,
  type SystemConfig,
  type SystemContext,
} from '@chakra-ui/react';

import { composePostkitSystem, type PostkitSystemOptions } from './theme.js';

/**
 * Composes an optional Postkit visual preset, a host Chakra system, and
 * contextual Postkit overrides. Postkit is host-native by default; pass
 * `postkitDefaultTheme` as `preset` to opt into its standalone appearance.
 * Without a `system`, it builds on Chakra's `defaultSystem`.
 */
export function createPostkitSystem(
  options?: PostkitSystemOptions,
): SystemContext;
/** @deprecated Prefer the options-object overload. */
export function createPostkitSystem(
  system?: SystemContext,
  theme?: SystemConfig,
): SystemContext;
export function createPostkitSystem(
  optionsOrSystem: PostkitSystemOptions | SystemContext = {},
  legacyTheme?: SystemConfig,
): SystemContext {
  const options: PostkitSystemOptions =
    '_config' in optionsOrSystem
      ? { system: optionsOrSystem, theme: legacyTheme }
      : optionsOrSystem;

  return composePostkitSystem({
    ...options,
    system: options.system ?? defaultSystem,
  });
}
