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

## Public API

- `createPostkitNextComponents(options?)`
- `PostkitNextComponentsOptions`
- `PostkitNextLinkOptions`
- `PostkitNextLinkProps`

The returned value is an MDX component map. Components supplied through
`options.components` override Postkit defaults.

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
