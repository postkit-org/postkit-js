---
title: TanStack Router
summary: Render Postkit MDX beneath TanStack Router and map portable URLs into typed routes.
category: Frameworks
order: 3
---

# TanStack Router

`@postkit/tanstack-router` converts internal Markdown destinations into router
links and keeps external URLs, protocol links, hashes, downloads, and explicit
non-default targets as native anchors.

```sh
npm install @postkit/tanstack-router @postkit/chakra @tanstack/react-router @chakra-ui/react @emotion/react react react-dom
```

It supports TanStack Router `>=1.120 <2` with React 19 and the matching
`@postkit/chakra` release.

## Create the component map

```tsx
import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';

export const mdxComponents = createPostkitTanStackRouterComponents();
```

Render the article beneath the application's TanStack Router provider and
`PostkitProvider`. The application owns its generated route tree, data loading,
and page layout. `PostkitProvider` is host-native by default; pass
`preset={postkitDefaultTheme}` only when Postkit's standalone visual treatment
is wanted.

## Recover typed routes

Plain Markdown stores destinations as strings. Resolve those strings into the
application's generated route tree at the adapter boundary:

```tsx
export const mdxComponents = createPostkitTanStackRouterComponents({
  link: {
    linkProps: { preload: 'intent' },
    mapLinkProps: ({ href }) => {
      const article = /^\/articles\/([^/]+)$/.exec(href);

      return article
        ? {
            to: '/articles/$slug',
            params: { slug: article[1] },
          }
        : {};
    },
  },
});
```

The link mapper can return route-specific `to`, `params`, `search`, mask, and
preload props.

## Customize components

```tsx
export const mdxComponents = createPostkitTanStackRouterComponents({
  components: {
    h2: ArticleHeading,
  },
});
```

If router context is missing, move the article beneath the router provider. If
a generated route rejects a portable string, translate it in `mapLinkProps`. A
checked example lives in the repository's `examples/tanstack-router` directory.
