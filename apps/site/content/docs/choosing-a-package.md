---
title: Choosing a package
summary: Match each PostKit package to the rendering environment and integration boundary it owns.
category: Start here
order: 20
---

# Choosing a package

Install the package closest to the application boundary. Framework adapters
already depend on the React component system and add their native routing
behavior.

| Package                    | Choose it for                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `@postkit/react`           | React components, Chakra theming, Markdown directives, or a framework-neutral MDX map |
| `@postkit/next`            | Next.js MDX and `next/link`                                                           |
| `@postkit/react-router`    | React Router and router-native internal links                                         |
| `@postkit/tanstack-router` | TanStack Router and application-defined typed route resolution                        |
| `@postkit/astro`           | Astro Markdown/MDX and selective React hydration                                      |
| `@postkit/unfurl`          | Server-side or build-time URL metadata normalization                                  |

## Common combinations

A Next.js publishing site commonly uses:

```sh
npm install @postkit/next @postkit/react
```

Add `@postkit/unfurl` to the server or build pipeline when the site renders link
previews:

```sh
npm install @postkit/unfurl
```

An Astro site should start with `@postkit/astro`, which documents the matching
Astro integrations and component bridge.

## What adapters do not own

Adapters do not configure the application's content loader, authentication,
asset storage, secrets, deployment platform, or outer page layout. Those remain
application concerns connected through explicit component props and resolver
functions.
