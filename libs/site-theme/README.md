# @postkit/site-theme

The postkit.org design tokens and Chakra v3 system, shared by `apps/site` and the
site's emails (`docs/design/handoff/specs/02-design-system.md`).

- `src/tokens.json` is the source of truth (copied from the handoff).
- `siteConfig` / `siteSystem` turn it into a Chakra system with light and dark
  semantic tokens. `theme.spec.ts` fails if `theme.ts` drifts from `tokens.json`.
- `tokens` exports the raw values for email templates, which can't use the Chakra system.
- `fontStacks` reads `--font-inter-tight` and `--font-jetbrains-mono` (set by the app's
  `next/font` loaders) and falls back to the family names.

Run `npm run site:typecheck` (typecheck, test and lint).
