# Next.js

Connect the Postkit component map to Next.js MDX with native next/link routing.

`@postkit/next` layers `next/link` over `@postkit/chakra`. Internal links stay
native to the Next.js router, while external URLs, protocol links, hashes,
downloads, and explicit non-default targets remain normal anchors.

```sh
npm install @postkit/next @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

It supports Next.js 15 and 16 with React 19 and the matching `@postkit/chakra`
release.

## Register the MDX components

Create the native MDX component map in `mdx-components.tsx`:

```tsx
// mdx-components.tsx
import { createPostkitNextComponents } from '@postkit/next';
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createPostkitNextComponents({ components });
}
```

The returned value is an MDX component map. Components supplied through
`options.components` override Postkit defaults, so site components take final
precedence:

```tsx
export function useMDXComponents(): MDXComponents {
  return createPostkitNextComponents({
    components: {
      h2: ArticleHeading,
    },
  });
}
```

## Mount the provider

Mount `PostkitProvider` in the application's provider tree:

```tsx
import { PostkitProvider, postkitDefaultTheme } from '@postkit/chakra';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostkitProvider preset={postkitDefaultTheme}>{children}</PostkitProvider>
  );
}
```

The preset is optional; omit it when the host Chakra recipes should provide the
visual policy. The application owns its Chakra system, page layout, content
loader, and Next.js image configuration.

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

## Remote MDX

The same map works with runtimes such as `next-mdx-remote`. Compile with
Postkit's Remark plugins so plain Markdown directives become components:

```tsx
import { createPostkitRemarkPlugins } from '@postkit/chakra/remark';
import { createPostkitNextComponents } from '@postkit/next';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

const components = createPostkitNextComponents();

const source = await serialize(markdown, {
  mdxOptions: { remarkPlugins: createPostkitRemarkPlugins() },
});

<MDXRemote {...source} components={components} />;
```

The package README and the checked Next.js example in the repository's
`examples/next` directory contain the complete adapter API.
