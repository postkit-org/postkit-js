# postkit-js — agent notes

Read `AGENTS.md` first: package boundaries, sources of truth, change invariants and validation live there. This file adds the postkit.org rebuild rules and the Nx guidance.

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

- `npm run site:check` for site work; `npm run check` for package work (the full list is in `AGENTS.md`).
- Playwright and axe for pages (`docs/design/handoff/specs/07-acceptance-and-test-plan.md`).
- Before a release: `npm run verify:release`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
