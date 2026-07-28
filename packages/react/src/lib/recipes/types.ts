'use client';

import {
  type SlotRecipeConfig,
  type SystemStyleObject,
  useChakraContext,
  useSlotRecipe,
} from '@chakra-ui/react';

export type PostkitSlotStyles<Slot extends string> = Partial<
  Readonly<Record<Slot, SystemStyleObject>>
>;

export function postkitSlotClassName(
  generated: string | undefined,
  supplied?: string,
): string | undefined {
  return [generated, supplied].filter(Boolean).join(' ') || undefined;
}

export function usePostkitSlotRecipe<Recipe extends SlotRecipeConfig>(
  key: string,
  fallback: Recipe,
) {
  const system = useChakraContext();
  const recipe = system.getSlotRecipe(key, fallback) as Recipe;
  return useSlotRecipe({ recipe });
}
