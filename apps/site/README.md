# Postkit site

The Postkit website is a Next.js Pages Router application built with Chakra UI
and the local Postkit packages.

From the workspace root:

```sh
npm run site:dev
npm run site:check
```

Both targets generate the public TypeDoc reference and agent-facing
documentation indexes before starting or building the site. Run their focused
checks with:

```sh
npm run docs:generate
npm run docs:check
```

TypeDoc HTML and JSON are emitted under `public/api` and are intentionally
untracked. `public/llms.txt`, `public/llms-full.txt`, and
`public/postkit-docs.json` (and the raw guide Markdown in `public/docs-md/`,
linked from `llms.txt`) are small generated artifacts kept in version control;
update them through `npm run docs:agents:generate`.

The notes and changelog feeds (`public/feeds/`) are generated and untracked:
`nx run site:feeds` writes them before every `nx build site`, from
`libs/site-feeds`.

## Analytics and error reporting

Fathom (through `react-fathom`) counts pageviews, and Sentry (`@sentry/nextjs`) reports
errors. Both stay off until their environment variables are set: with none of them, the
site loads no analytics or error-reporting script, makes no requests to either service and
sets no cookies. `.env.example` lists every variable; copy it to `.env.local` locally or
set the values in Vercel. Never commit values.

| Variable                     | Turns on                                                      |
| ---------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_FATHOM_SITE_ID` | Fathom pageviews and goals                                    |
| `NEXT_PUBLIC_SENTRY_DSN`     | Sentry in the browser, server and edge, plus the tunnel route |
| `SENTRY_AUTH_TOKEN`          | Source-map upload during `next build` (CI only)               |
| `SENTRY_ORG`                 | The Sentry organization for the upload                        |
| `SENTRY_PROJECT`             | The Sentry project for the upload                             |

The `NEXT_PUBLIC_` values are read at build time, so rebuild after changing them.

- **Fathom** (`src/lib/analytics.ts`, `src/components/site-analytics.tsx`) sends pageviews
  on load and on each route change, plus three goals and nothing else:
  `subscribe-request`, `subscribe-confirmed` and `copy-install`. Record one with
  `trackGoal('copy-install')`, which does nothing while Fathom is off. Tracked URLs never
  include the `token` query parameter, an email address or the fragment.
- **Sentry** (`src/instrumentation.ts`, `src/instrumentation-client.ts`,
  `src/lib/sentry-options.ts`) runs with `sendDefaultPii: false`, 10% tracing, no session
  replay and a tunnel route so ad blockers don't drop events. Before anything is sent,
  `@postkit/site-telemetry` removes email addresses and `token` parameters from messages,
  exceptions, breadcrumbs, URLs, query strings, headers and request bodies. Turn on
  "Prevent storing of IP addresses" in the Sentry project settings too.

## Changelog entries

Add release notes to the shared `libs/content/changelog` library as `.md` files
with lowercase, URL-safe filenames. Every entry requires this frontmatter:

```yaml
---
title: Postkit 0.2.0
version: 0.2.0
date: 2026-08-01
summary: A short release summary.
tags:
  - components
---
```

The build renders semantic Markdown with Postkit prose components. Rich Postkit
components are available through literal-only directives:

```md
:::postkit-callout{title="Release status" tone="tip"}
This content is rendered by Postkit.
:::
```

Content Collections validates the entry metadata and generates the typed
collection consumed by the site. Unknown component props fail the build so
changelog content cannot drift from the Postkit component contract.
