# Postkit for TanStack Router

`@postkit/tanstack-router` installs Postkit's article components
into an MDX component map and routes internal Markdown links through TanStack
Router.

```tsx
import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';

export const mdxComponents = createPostkitTanStackRouterComponents({
  components: {
    h2: ArticleHeading,
  },
});
```

The rendered article must be beneath the application's TanStack Router
provider. External URLs, protocol links, hashes, downloads, and explicit
non-default targets remain native anchors.

Plain Markdown destinations are passed to `to`. Applications can resolve a
content URL into route-specific `to`, `params`, `search`, mask, or preload
props:

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

This resolver is the appropriate place for an application to recover its
generated route tree's stronger types from portable Markdown strings.
