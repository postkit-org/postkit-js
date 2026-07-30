# `@postkit/tanstack-router`

PostKit article components, MDX mapping, and internal-link routing for TanStack
Router.

## When to use it

Use this adapter when a TanStack Router application renders Markdown or MDX
with PostKit. It converts internal Markdown destinations into router links and
keeps external URLs, protocol links, hashes, downloads, and explicit
non-default targets as native anchors.

## Install

```sh
npm install @postkit/tanstack-router @postkit/react @tanstack/react-router @chakra-ui/react @emotion/react react react-dom
```

Supported peer versions:

- TanStack Router 1.x
- React 19
- The matching `@postkit/react` release

## Quick start

Create the component map:

```tsx
import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';

export const mdxComponents = createPostkitTanStackRouterComponents();
```

Render the article beneath the application's TanStack Router provider and
`PostkitProvider`. The application owns its generated route tree, data loading,
and page layout.

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

## Public API

- `createPostkitTanStackRouterComponents(options?)`
- `PostkitTanStackRouterComponentsOptions`
- `PostkitTanStackRouterLinkOptions`
- `PostkitTanStackLinkProps`

## Troubleshooting

- If router context is missing, move the article beneath the router provider.
- If a generated route rejects a portable string, translate it in
  `mapLinkProps`.
- If components are unstyled, render the article beneath `PostkitProvider`.

See the [`@postkit/react`](../react) guide for components, declarations,
Markdown directives, and theming. A checked
[TanStack Router example](../../examples/tanstack-router) is included in the
repository.
