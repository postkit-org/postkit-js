'use client';

import { type SlotRecipeConfig, useChakraContext } from '@chakra-ui/react';
import type { AnyPostkitComponentDefinition } from '@postkit/core/components';
import {
  postkitPartAttributes,
  resolvePostkitViewState,
  type PostkitPartAttributes,
} from '@postkit/react';

/** Returns the anatomy attributes for one part of a Chakra view. */
export type PostkitChakraAnatomy<Slot extends string = string> = (
  part: Slot,
) => PostkitPartAttributes;

/**
 * The anatomy attributes (03 §5.1) for Chakra views that compose Chakra's own
 * Ark parts and so don't use `postkitChakraView` (Tabs, CodeBlock, CodeGroup,
 * LinkPreview, SocialPost). It resolves theme-variant state as
 * `postkitChakraView` does, with the registered recipe's defaults winning
 * over the definition's, so the headless and Chakra views stamp the same
 * `data-postkit-*` attributes on the same parts.
 *
 * @internal
 */
export function usePostkitChakraAnatomy<Slot extends string = string>(
  definition: AnyPostkitComponentDefinition,
  authored: Readonly<Record<string, unknown>>,
  options: { readonly recipeKey: string; readonly unstyled?: boolean },
): PostkitChakraAnatomy<Slot> {
  const registered = useChakraContext().getSlotRecipe(options.recipeKey) as
    SlotRecipeConfig | undefined;
  const { state } = resolvePostkitViewState(definition, authored, {
    themeDefaults: registered?.defaultVariants,
  });
  return (part) =>
    postkitPartAttributes(definition, part, state, {
      unstyled: options.unstyled,
    });
}
