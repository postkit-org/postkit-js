# `@postkit/next`

Postkit article components, MDX mapping, and internal-link routing for Next.js.

## When to use it

Use this adapter when a Next.js application renders Markdown or MDX with
Postkit. It layers `next/link` over `@postkit/chakra` while preserving native
anchors for external URLs, protocol links, hashes, downloads, and explicit
non-default targets.

## Install

```sh
npm install @postkit/next @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

Supported peer versions:

- Next.js 15 or 16
- React 19
- The matching `@postkit/chakra` release

## Quick start

Create Next.js's native MDX component file:

```tsx
// mdx-components.tsx
import { createPostkitNextComponents } from '@postkit/next';
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createPostkitNextComponents({ components });
}
```

Mount `PostkitProvider` in the application's provider tree:

```tsx
import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostkitProvider preset={postkitDefaultTheme}>{children}</PostkitProvider>
  );
}
```

The consuming application owns its Chakra system, page layout, content loader,
and Next.js image configuration. The preset is optional; omit it when the host
Chakra recipes should provide the visual policy.

## Customize components

Site components take final precedence:

```tsx
export function useMDXComponents(): MDXComponents {
  return createPostkitNextComponents({
    components: {
      h2: ArticleHeading,
    },
  });
}
```

## Customize links

Next-specific link props can be supplied globally or derived for each
destination:

```tsx
export function useMDXComponents(): MDXComponents {
  return createPostkitNextComponents({
    link: {
      linkProps: { prefetch: false },
      mapLinkProps: ({ href }) => ({
        scroll: !href.startsWith('/reference/'),
      }),
    },
  });
}
```

## With `createPostkit`

The `createPostkit` preset configures a site from its kits, components,
defaults and overrides, with internal links routed through Next.js:

```ts
import { chakraLazy } from '@postkit/chakra';
import { createPostkit } from '@postkit/next';
import { article, media, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  renderer: chakraLazy,
  kits: [article, technical, media],
});
// postkit.Provider, postkit.mdxComponents, postkit.manifest(); at build time,
// postkitRemarkPlugins(postkit) from '@postkit/react/remark'
```

It needs `@postkit/react` installed alongside `@postkit/chakra`.

## Public API

- `createPostkit(options)`: `createPostkit` from `@postkit/react` with `link`
  set to the Next.js link (pass link options or a component as `link`)
- `CreatePostkitNextOptions`
- `createPostkitNextLink(options?)`
- `createPostkitNextComponents(options?)`
- `PostkitNextComponentsOptions`
- `PostkitNextLinkOptions`
- `PostkitNextLinkProps`

The returned value is an MDX component map. Components supplied through
`options.components` override Postkit defaults.

Each component view in the map loads the first time a page renders it
(`createPostkitLazyMdxComponents` from `@postkit/chakra`), so a page only
downloads the views its content uses. Next.js waits for them on the server, so
the HTML is complete, and the browser keeps that HTML until a view has loaded,
so nothing shifts. For a synchronous render such as `renderToStaticMarkup`,
pass the eager views: `createPostkitNextComponents({ components: postkitChakraViews })`.
For `createPostkit`, pass `renderer: chakraLazy` for the same behaviour.

## Troubleshooting

- If Postkit-specific layouts are bare, opt into `postkitDefaultTheme` or
  register Postkit slot recipes in the host Chakra system.
- If internal links reload the page, confirm this adapter's component map is
  passed to the MDX runtime.
- If a site component is ignored, pass it through `components` in the same map
  supplied to the renderer.

See the [`@postkit/chakra`](../chakra) guide for components, declarations,
Markdown directives, and theming. A checked
[Next.js adapter example](../../examples/next) is included in the repository.
