# postkit-js — agent notes

## The site (`apps/site`)

- The postkit.org rebuild follows `docs/design/handoff/` (start at `docs/design/handoff/README.md`). Tickets are `PK-###` in `docs/design/handoff/specs/06-work-breakdown.md`.
- Stack: Next.js Pages Router, Chakra UI v3, `@postkit/chakra`, next-themes, next-meta, react-structured, react-fathom, `@sentry/nextjs`, Resend. Hosted on Vercel.
- Theme and tokens live in `libs/site-theme`. Never hard-code a colour in `apps/site`.
- Content lives in `libs/content` (docs, changelog, notes, components). Frontmatter is validated with Zod, and `status: draft` hides an entry in production.
- Every page needs to work in light and dark, at 1440, 390 and 320.

## Conventions

- Create projects with Nx generators (`nx g @nx/js:library`, `nx g @nx/react:library`, …), never by hand.
- The brand is "Postkit". `git grep PostKit` should always be empty.
- The site uses the packages from this commit. Don't copy component code into the site; fix the package instead (`docs/design/handoff/specs/03-component-system.md`).
- Queue slow or external work where the reader isn't waiting for it. Subscribe emails are the one documented exception (`docs/design/handoff/specs/09-content-callouts.md` Q1).

## Checks

- `npm run site:check` for site work; `npm run check` for package work.
- Playwright and axe for pages (`docs/design/handoff/specs/07-acceptance-and-test-plan.md`).
- Before a release: `npm run verify:release`.
