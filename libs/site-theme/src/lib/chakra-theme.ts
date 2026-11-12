// Chakra's default theme, cut down to what postkit.org renders.
//
// `defaultConfig` carries every built-in recipe, and a bundler can't drop the ones nobody
// renders because they're data. The site builds on `defaultBaseConfig` plus this config:
// Chakra's tokens, semantic tokens, keyframes, text, layer and animation styles, global CSS
// and preflight unchanged (`chakra-theme.json`, generated from the installed Chakra), and
// only the built-in recipes some component on the site can render.
//
// `chakra-theme.spec.ts` derives that list from every Chakra component the site, its
// libraries, `@postkit/chakra` and chakra-docs import, and fails when it changes.
import { defineConfig } from '@chakra-ui/react';
import {
  alertSlotRecipe,
  avatarSlotRecipe,
  badgeRecipe,
  blockquoteSlotRecipe,
  buttonRecipe,
  cardSlotRecipe,
  carouselSlotRecipe,
  codeBlockSlotRecipe,
  codeRecipe,
  containerRecipe,
  dialogSlotRecipe,
  fieldSlotRecipe,
  headingRecipe,
  iconRecipe,
  inputAddonRecipe,
  inputRecipe,
  kbdRecipe,
  linkRecipe,
  listSlotRecipe,
  markRecipe,
  menuSlotRecipe,
  nativeSelectSlotRecipe,
  progressSlotRecipe,
  ratingGroupSlotRecipe,
  separatorRecipe,
  spinnerRecipe,
  statSlotRecipe,
  tableSlotRecipe,
  tabsSlotRecipe,
  textareaRecipe,
  tooltipSlotRecipe,
} from '@chakra-ui/react/theme';

import chakraTheme from './chakra-theme.json' with { type: 'json' };

/** Built-in recipes, under the keys Chakra's components read them by. */
export const chakraRecipes = {
  badge: badgeRecipe,
  button: buttonRecipe,
  code: codeRecipe,
  container: containerRecipe,
  heading: headingRecipe,
  icon: iconRecipe,
  input: inputRecipe,
  inputAddon: inputAddonRecipe,
  kbd: kbdRecipe,
  link: linkRecipe,
  mark: markRecipe,
  separator: separatorRecipe,
  spinner: spinnerRecipe,
  textarea: textareaRecipe,
};

/** Built-in slot recipes, under the keys Chakra's components read them by. */
export const chakraSlotRecipes = {
  alert: alertSlotRecipe,
  avatar: avatarSlotRecipe,
  blockquote: blockquoteSlotRecipe,
  card: cardSlotRecipe,
  carousel: carouselSlotRecipe,
  codeBlock: codeBlockSlotRecipe,
  dialog: dialogSlotRecipe,
  field: fieldSlotRecipe,
  list: listSlotRecipe,
  menu: menuSlotRecipe,
  nativeSelect: nativeSelectSlotRecipe,
  progress: progressSlotRecipe,
  ratingGroup: ratingGroupSlotRecipe,
  stat: statSlotRecipe,
  table: tableSlotRecipe,
  tabs: tabsSlotRecipe,
  tooltip: tooltipSlotRecipe,
};

/** `defaultConfig` minus `defaultBaseConfig`, with only the recipes above. */
export const chakraThemeConfig = defineConfig({
  ...chakraTheme,
  theme: {
    ...chakraTheme.theme,
    recipes: chakraRecipes,
    slotRecipes: chakraSlotRecipes,
  },
});
