// Writes src/lib/chakra-theme.json: Chakra's default theme config (preflight, global CSS,
// tokens, semantic tokens, keyframes and the text, layer and animation styles) without its
// built-in recipes. `chakra-theme.ts` adds back the recipes the site renders.
//
//   node libs/site-theme/scripts/generate-chakra-theme.mjs
//
// The site can't import these values from `@chakra-ui/react/theme`: that module also builds
// `defaultThemeConfig`, which keeps every built-in recipe in the bundle. Rerun this after a
// Chakra upgrade; `chakra-theme.spec.ts` fails until the copy matches the installed version.
import { defaultThemeConfig } from '@chakra-ui/react/theme';
import { writeFileSync } from 'node:fs';

const { theme, ...config } = defaultThemeConfig;
const themeWithoutRecipes = Object.fromEntries(
  Object.entries(theme).filter(
    ([key]) => key !== 'recipes' && key !== 'slotRecipes',
  ),
);

writeFileSync(
  new URL('../src/lib/chakra-theme.json', import.meta.url),
  `${JSON.stringify({ ...config, theme: themeWithoutRecipes }, null, 2)}\n`,
);
