# `@postkit/tanstack-router`

Postkit article components, MDX mapping, and internal-link routing for TanStack
Router.

## When to use it

Use this adapter when a TanStack Router application renders Markdown or MDX
with Postkit. It converts internal Markdown destinations into router links and
keeps external URLs, protocol links, hashes, downloads, and explicit
non-default targets as native anchors.

## Install

```sh
npm install @postkit/tanstack-router @postkit/chakra @tanstack/react-router @chakra-ui/react @emotion/react react react-dom
```

Supported peer versions:

- TanStack Router 1.x
- React 19
- The matching `@postkit/chakra` release

## Quick start

Create the component map:

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

## With `createPostkit`

The `createPostkit` preset configures a site from its kits, components,
defaults and overrides, with internal links routed through TanStack Router:

```ts
import { chakra } from '@postkit/chakra';
import { createPostkit } from '@postkit/tanstack-router';
import { article, media, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
});
// postkit.Provider, postkit.mdxComponents, postkit.manifest(); at build time,
// postkitRemarkPlugins(postkit) from '@postkit/react/remark'
```

It needs `@postkit/react` installed alongside `@postkit/chakra`.

## Public API

- `createPostkit(options)`: `createPostkit` from `@postkit/react` with `link`
  set to the TanStack Router link (pass link options or a component as `link`)
- `CreatePostkitTanStackRouterOptions`
- `createPostkitTanStackRouterLink(options?)`
- `createPostkitTanStackRouterComponents(options?)`: prose and component views, with each view
  loading the first time a page renders it (`createPostkitLazyMdxComponents`
  from `@postkit/chakra`). A streaming server render waits for the views, so
  the HTML is complete. For a synchronous render such as
  `renderToStaticMarkup`, pass `components: postkitChakraViews`.
- `PostkitTanStackRouterComponentsOptions`
- `PostkitTanStackRouterLinkOptions`
- `PostkitTanStackLinkProps`

## Troubleshooting

- If router context is missing, move the article beneath the router provider.
- If a generated route rejects a portable string, translate it in
  `mapLinkProps`.
- If Postkit-specific layouts are bare, opt into `postkitDefaultTheme` or
  register Postkit slot recipes in the host Chakra system.

See the [`@postkit/chakra`](../chakra) guide for components, declarations,
Markdown directives, and theming. A checked
[TanStack Router example](../../examples/tanstack-router) is included in the
repository.
