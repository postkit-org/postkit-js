# Postkit for React Router

`@postkit/react-router` installs Postkit's article components
into an MDX component map and routes internal Markdown links through React
Router.

```tsx
import { createPostkitReactRouterComponents } from '@postkit/react-router';

export const mdxComponents = createPostkitReactRouterComponents({
  components: {
    h2: ArticleHeading,
  },
});
```

The rendered article must be beneath the application's React Router provider.
External URLs, protocol links, hashes, downloads, and explicit non-default
targets remain native anchors.

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
