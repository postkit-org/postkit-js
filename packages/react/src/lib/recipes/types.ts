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

const unstyledRecipeCache = new WeakMap<object, SlotRecipeConfig>();

function unstyledSlotRecipe<Recipe extends SlotRecipeConfig>(
  recipe: Recipe,
): Recipe {
  const cached = unstyledRecipeCache.get(recipe);
  if (cached) return cached as Recipe;

  const unstyled = {
    className: recipe.className,
    slots: recipe.slots,
  } as Recipe;
  unstyledRecipeCache.set(recipe, unstyled);
  return unstyled;
}

export function postkitSlotClassName(
  generated: string | undefined,
  supplied?: string,
): string | undefined {
  return [generated, supplied].filter(Boolean).join(' ') || undefined;
}

export function usePostkitSlotRecipe<Recipe extends SlotRecipeConfig>(
  key: string,
  defaultRecipe: Recipe,
) {
  const system = useChakraContext();
  const recipe = system.getSlotRecipe(
    key,
    unstyledSlotRecipe(defaultRecipe),
  ) as Recipe;
  return useSlotRecipe({ recipe });
}
