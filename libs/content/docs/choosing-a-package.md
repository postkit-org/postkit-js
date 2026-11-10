---
title: Choosing a package
summary: Match each Postkit package to the rendering environment and integration boundary it owns.
category: Start here
order: 20
---

# Choosing a package

Install the package closest to the application boundary. Framework adapters
use the Chakra-based React component system and add their native routing
behavior.

| Package                    | Choose it for                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `@postkit/core`            | Versioned HTML, Markdown, MDX, and JSON interchange without a React dependency        |
| `@postkit/chakra`          | React components, Chakra theming, Markdown directives, or a framework-neutral MDX map |
| `@postkit/email`           | Chakra Email rendering with explicit email-safe component fallbacks                   |
| `@postkit/shiki`           | Lazy Shiki syntax highlighting for Postkit and Chakra code blocks                     |
| `@postkit/next`            | Next.js MDX and `next/link`                                                           |
| `@postkit/react-router`    | React Router and router-native internal links                                         |
| `@postkit/tanstack-router` | TanStack Router and application-defined typed route resolution                        |
| `@postkit/astro`           | Astro Markdown/MDX and selective React hydration                                      |
| `@postkit/unfurl`          | Server-side or build-time URL metadata normalization                                  |

`@postkit/chakra` is the Chakra UI renderer, previously named `@postkit/react`.
The `@postkit/react` name is reserved for a future generic React renderer without
a Chakra dependency. The current framework adapters use `@postkit/chakra`.

## Common combinations

An API, feed processor, or non-React content service can use the core document
contract by itself:

```sh
npm install @postkit/core
```

A Next.js publishing site commonly uses:

```sh
npm install @postkit/next @postkit/chakra
```

Add `@postkit/unfurl` to the server or build pipeline when the site renders link
previews:

```sh
npm install @postkit/unfurl
```

Add `@postkit/shiki` when rendered code blocks need syntax highlighting:

```sh
npm install @postkit/shiki
```

An Astro site should start with `@postkit/astro`, which documents the matching
Astro integrations and component bridge.

An HTML email build should use `@postkit/email` rather than aliasing Chakra UI
to an email primitive package. It shares portable Postkit props where the
meaning carries over and deliberately changes the output for interactions that
email clients do not support.

## What adapters do not own

Adapters do not configure the application's content loader, authentication,
asset storage, secrets, deployment platform, or outer page layout. Those remain
application concerns connected through explicit component props and resolver
functions.
