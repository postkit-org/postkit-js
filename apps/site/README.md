# PostKit site

The PostKit website is a Next.js Pages Router application built with Chakra UI
and the local PostKit packages.

From the workspace root:

```sh
npm run site:dev
npm run site:check
```

## Changelog entries

Add release notes to `content/changelog` as `.md` files with lowercase,
URL-safe filenames. Every entry requires this frontmatter:

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

Unknown component props fail the build so changelog content cannot drift from
the PostKit component contract.
