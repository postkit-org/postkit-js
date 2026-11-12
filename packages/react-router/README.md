# `@postkit/react-router`

Postkit article components, MDX mapping, and internal-link routing for React
Router.

## When to use it

Use this adapter when a React Router application renders Markdown or MDX with
Postkit. It routes internal destinations through React Router and leaves
external URLs, protocol links, hashes, downloads, and explicit non-default
targets as native anchors.

## Install

```sh
npm install @postkit/react-router @postkit/chakra @chakra-ui/react @emotion/react react react-dom react-router
```

Supported peer versions:

- React Router 7
- React 19
- The matching `@postkit/chakra` release

## Quick start

Create the component map:

```tsx
import { createPostkitReactRouterComponents } from '@postkit/react-router';

export const mdxComponents = createPostkitReactRouterComponents();
```

Render the article beneath both the application router and `PostkitProvider`:

```tsx
import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';
import { BrowserRouter } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <PostkitProvider preset={postkitDefaultTheme}>
        <Article components={mdxComponents} />
      </PostkitProvider>
    </BrowserRouter>
  );
}
```

The application owns route definitions, data loading, and the outer page
layout. The preset is optional; omit it when the host Chakra recipes should
provide the visual policy.

## Customize components

```tsx
export const mdxComponents = createPostkitReactRouterComponents({
  components: {
    h2: ArticleHeading,
  },
});
```

## Customize links

Router-specific link props can be supplied globally or derived for each
destination:

```tsx
export const mdxComponents = createPostkitReactRouterComponents({
  link: {
    linkProps: { prefetch: 'intent' },
    mapLinkProps: ({ href }) => ({
      preventScrollReset: href.startsWith('?'),
    }),
  },
});
```

## With `createPostkit`

The `createPostkit` preset configures a site from its kits, components,
defaults and overrides, with internal links routed through React Router:

```ts
import { chakra } from '@postkit/chakra';
import { createPostkit } from '@postkit/react-router';
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
  set to the React Router link (pass link options or a component as `link`)
- `CreatePostkitReactRouterOptions`
- `createPostkitReactRouterLink(options?)`
- `createPostkitReactRouterComponents(options?)`: prose and component views, with each view
  loading the first time a page renders it (`createPostkitLazyMdxComponents`
  from `@postkit/chakra`). A streaming server render waits for the views, so
  the HTML is complete. For a synchronous render such as
  `renderToStaticMarkup`, pass `components: postkitChakraViews`.
- `PostkitReactRouterComponentsOptions`
- `PostkitReactRouterLinkOptions`

## Troubleshooting

- If React Router reports missing context, move the rendered article beneath
  the router provider.
- If Postkit-specific layouts are bare, opt into `postkitDefaultTheme` or
  register Postkit slot recipes in the host Chakra system.
- If links use native navigation, confirm this adapter's component map is
  passed to the MDX runtime.

See the [`@postkit/chakra`](../chakra) guide for components, declarations,
Markdown directives, and theming. A checked
[React Router example](../../examples/react-router) is included in the
repository.
