# Postkit

[![codecov](https://codecov.io/gh/postkit-org/postkit-js/graph/badge.svg)](https://codecov.io/gh/postkit-org/postkit-js)

Postkit is a portable publishing toolkit for rendering structured articles
across React, email, Next.js, React Router, TanStack Router, and Astro. It
combines an article component system, Markdown and MDX tooling, framework-aware
links, and provider-neutral URL metadata resolution.

Use Postkit when content should keep its meaning while the application, router,
or rendering environment changes.

## Choose a package

| Package                                                | Use it when                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`@postkit/react`](packages/react)                     | A React application needs article components, Markdown/MDX mappings, directives, or Chakra-based theming. |
| [`@postkit/email`](packages/email)                     | An email build needs Postkit content rendered with Chakra Email primitives and email-safe fallbacks.      |
| [`@postkit/shiki`](packages/shiki)                     | A Postkit application needs lazy Shiki syntax highlighting for Chakra code blocks.                        |
| [`@postkit/next`](packages/next)                       | A Next.js application needs the React component map with `next/link` routing.                             |
| [`@postkit/react-router`](packages/react-router)       | A React Router application needs Postkit components and router-native internal links.                     |
| [`@postkit/tanstack-router`](packages/tanstack-router) | A TanStack Router application needs Postkit components and typed route resolution.                        |
| [`@postkit/astro`](packages/astro)                     | An Astro site needs Markdown/MDX integration with selective React hydration.                              |
| [`@postkit/unfurl`](packages/unfurl)                   | A server or build process needs normalized Open Graph, oEmbed, link-preview, or social-post metadata.     |

Framework adapters depend on `@postkit/react`; install the adapter that matches
the application rather than assembling its routing integration by hand.

## Start in React

Install Postkit and its peer dependencies:

```sh
npm install @postkit/react @chakra-ui/react @emotion/react react react-dom
```

Mount `PostkitProvider`, then use individual components or the supplied MDX
component map:

```tsx
import {
  createPostkitMdxComponents,
  Callout,
  PostkitProvider,
} from '@postkit/react';

export const mdxComponents = createPostkitMdxComponents();

export function Article() {
  return (
    <PostkitProvider>
      <main>
        <h1>Portable publishing</h1>
        <Callout title="Keep the content" tone="tip">
          Change the renderer without changing the article.
        </Callout>
      </main>
    </PostkitProvider>
  );
}
```

For a framework application, continue with its package guide:

- [Next.js](packages/next)
- [React Router](packages/react-router)
- [TanStack Router](packages/tanstack-router)
- [Astro](packages/astro)

## How the pieces fit together

```text
Markdown, MDX, or structured declarations
                    |
        Postkit component contract
                    |
       Framework component adapter
                    |
     Site theme, router, and resolvers
                    |
          Rendered article output
```

Postkit owns the portable content contract and default presentation. The
application still owns its outer layout, Chakra system, routing policy, asset
pipeline, secrets, and server-side unfurling service.

`@postkit/unfurl` is deliberately separate from rendering. It normalizes remote
metadata behind a server or build-time boundary; components consume the
normalized result without receiving provider credentials.

## Documentation

- [Component and theming guide](packages/react)
- [Email rendering guide](packages/email)
- [Shiki code-block adapter](packages/shiki)
- [Unfurling and oEmbed guide](packages/unfurl)
- [Astro integration and hydration policy](packages/astro)
- [Executable framework and service examples](examples)
- [Generated TypeScript API reference](libs/content/docs/api-reference.md)
- [Agent documentation index](apps/site/public/llms.txt)
- [Contributing](CONTRIBUTING.md)
- [Release process](RELEASING.md)
- [Changelog](apps/site/content/changelog)

The documentation site and generated component catalog live in `apps/site`.
Package READMEs remain self-contained because npm renders the README from each
published package.

## Project status

Postkit is in its initial public release series. Public APIs are typed and
release artifacts are tested in a clean consumer, but additions and refinements
should be expected before `1.0`.

`@postkit/prismark` remains in the Prismark workspace until
`@prismark/component-protocol` is published independently.

Postkit is available under the [MIT License](LICENSE).

## Compatibility and support

| Integration     | Supported range |
| --------------- | --------------- |
| React           | 19              |
| Chakra UI       | `^3.36.0`       |
| Shiki           | `^4.3.1`        |
| Next.js         | `>=15 <17`      |
| React Router    | `>=7 <8`        |
| TanStack Router | `>=1.120 <2`    |
| Astro           | `>=6.4 <8`      |

See [compatibility and environments](libs/content/docs/compatibility.md)
for rendering details, [support](SUPPORT.md) for issue guidance, and the
[security policy](SECURITY.md) for private vulnerability reporting and trust
boundaries.
