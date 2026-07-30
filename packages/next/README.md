# `@postkit/next`

PostKit article components, MDX mapping, and internal-link routing for Next.js.

## When to use it

Use this adapter when a Next.js application renders Markdown or MDX with
PostKit. It layers `next/link` over `@postkit/react` while preserving native
anchors for external URLs, protocol links, hashes, downloads, and explicit
non-default targets.

## Install

```sh
npm install @postkit/next @postkit/react @chakra-ui/react @emotion/react react react-dom
```

Supported peer versions:

- Next.js 15 or 16
- React 19
- The matching `@postkit/react` release

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
import { PostkitProvider } from '@postkit/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <PostkitProvider>{children}</PostkitProvider>;
}
```

The consuming application owns its Chakra system, page layout, content loader,
and Next.js image configuration.

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

## Public API

- `createPostkitNextComponents(options?)`
- `PostkitNextComponentsOptions`
- `PostkitNextLinkOptions`
- `PostkitNextLinkProps`

The returned value is an MDX component map. Components supplied through
`options.components` override PostKit defaults.

## Troubleshooting

- If components are unstyled, render the article beneath `PostkitProvider`.
- If internal links reload the page, confirm this adapter's component map is
  passed to the MDX runtime.
- If a site component is ignored, pass it through `components` in the same map
  supplied to the renderer.

See the [`@postkit/react`](../react) guide for components, declarations,
Markdown directives, and theming. A checked
[Next.js adapter example](../../examples/next) is included in the repository.
