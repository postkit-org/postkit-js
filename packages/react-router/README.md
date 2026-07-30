# `@postkit/react-router`

PostKit article components, MDX mapping, and internal-link routing for React
Router.

## When to use it

Use this adapter when a React Router application renders Markdown or MDX with
PostKit. It routes internal destinations through React Router and leaves
external URLs, protocol links, hashes, downloads, and explicit non-default
targets as native anchors.

## Install

```sh
npm install @postkit/react-router @postkit/react @chakra-ui/react @emotion/react react react-dom react-router
```

Supported peer versions:

- React Router 7
- React 19
- The matching `@postkit/react` release

## Quick start

Create the component map:

```tsx
import { createPostkitReactRouterComponents } from '@postkit/react-router';

export const mdxComponents = createPostkitReactRouterComponents();
```

Render the article beneath both the application router and `PostkitProvider`:

```tsx
import { PostkitProvider } from '@postkit/react';
import { BrowserRouter } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <PostkitProvider>
        <Article components={mdxComponents} />
      </PostkitProvider>
    </BrowserRouter>
  );
}
```

The application owns route definitions, data loading, and the outer page
layout.

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

## Public API

- `createPostkitReactRouterComponents(options?)`
- `PostkitReactRouterComponentsOptions`
- `PostkitReactRouterLinkOptions`

## Troubleshooting

- If React Router reports missing context, move the rendered article beneath
  the router provider.
- If components are unstyled, render the article beneath `PostkitProvider`.
- If links use native navigation, confirm this adapter's component map is
  passed to the MDX runtime.

See the [`@postkit/react`](../react) guide for components, declarations,
Markdown directives, and theming. A checked
[React Router example](../../examples/react-router) is included in the
repository.
