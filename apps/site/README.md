# PostKit site

The PostKit website is a Next.js Pages Router application built with Chakra UI
and the local PostKit packages.

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
`public/postkit-docs.json` are small generated artifacts kept in version
control; update them through `npm run docs:agents:generate`.

## Changelog entries

Add release notes to the shared `libs/content/changelog` library as `.md` files
with lowercase, URL-safe filenames. Every entry requires this frontmatter:

```yaml
---
title: PostKit 0.2.0
version: 0.2.0
date: 2026-08-01
summary: A short release summary.
tags:
  - components
---
```

The build renders semantic Markdown with PostKit prose components. Rich PostKit
components are available through literal-only directives:

```md
:::postkit-callout{title="Release status" tone="tip"}
This content is rendered by PostKit.
:::
```

Content Collections validates the entry metadata and generates the typed
collection consumed by the site. Unknown component props fail the build so
changelog content cannot drift from the PostKit component contract.
