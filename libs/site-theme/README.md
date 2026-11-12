# @postkit/site-theme

The postkit.org design tokens and Chakra v3 system, shared by `apps/site` and the
site's emails (`docs/design/handoff/specs/02-design-system.md`).

- `src/tokens.json` is the source of truth (copied from the handoff).
- `siteConfig` / `siteSystem` turn it into a Chakra system with light and dark
  semantic tokens. `theme.spec.ts` fails if `theme.ts` drifts from `tokens.json`.
- `siteRecipes` (`siteButton`, `siteKbd`) and `siteSlotRecipes` (`siteSegmentedControl`,
  `siteTextField`, `siteTile`) are the site primitives from the Interaction states board,
  registered on `siteConfig`. They're prefixed `site` so Chakra's built-in recipes, which
  Postkit's components use, keep their look. The React wrappers live in
  `apps/site/src/components/primitives`.
- `siteSystem` builds on Chakra's `defaultBaseConfig` and `chakraThemeConfig`
  (`chakra-theme.ts`), not `defaultConfig`: Chakra's tokens, global CSS and styles
  unchanged, but only the built-in recipes something on the site renders, which keeps the
  rest out of every page's JavaScript. `chakra-theme.spec.ts` derives that list from the
  Chakra components the site, its libraries, `@postkit/chakra` and chakra-docs import, and
  fails when it drifts. `chakra-theme.json` is generated from the installed Chakra by
  `node libs/site-theme/scripts/generate-chakra-theme.mjs`; rerun it after a Chakra upgrade.
- `tokens` exports the raw values for email templates, which can't use the Chakra system.
- `fontStacks` reads `--font-inter-tight` and `--font-jetbrains-mono` (set by the app's
  `next/font` loaders) and falls back to the family names.

Run `npm run site:typecheck` (typecheck, test and lint).
