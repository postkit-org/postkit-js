import type { RecipeDefinition, SlotRecipeConfig } from '@chakra-ui/react';

import { siteButtonRecipe } from './button';
import { siteKbdRecipe } from './kbd';
import { siteSegmentedControlRecipe } from './segmented-control';
import { siteTextFieldRecipe } from './text-field';
import { siteTileRecipe } from './tile';

export { siteButtonRecipe } from './button';
export { siteKbdRecipe } from './kbd';
export { siteSegmentedControlRecipe } from './segmented-control';
export { siteTextFieldRecipe } from './text-field';
export { siteTileRecipe } from './tile';

/** Registered in `siteConfig.theme.recipes`; read with `useRecipe({ key: 'siteButton' })`. */
export const siteRecipes: {
  siteButton: RecipeDefinition;
  siteKbd: RecipeDefinition;
} = {
  siteButton: siteButtonRecipe,
  siteKbd: siteKbdRecipe,
};

/** Registered in `siteConfig.theme.slotRecipes`; read with `useSlotRecipe({ key })`. */
export const siteSlotRecipes: {
  siteSegmentedControl: SlotRecipeConfig;
  siteTextField: SlotRecipeConfig;
  siteTile: SlotRecipeConfig;
} = {
  siteSegmentedControl: siteSegmentedControlRecipe,
  siteTextField: siteTextFieldRecipe,
  siteTile: siteTileRecipe,
};
