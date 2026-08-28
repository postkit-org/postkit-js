---
title: Getting started
summary: Install PostKit, mount its provider, and render a first portable article component.
category: Start here
order: 10
---

# Getting started

PostKit gives articles a portable component vocabulary while leaving the host
application in control of routing, layout, assets, and remote services.

## Install the React package

```sh
npm install @postkit/react @chakra-ui/react @emotion/react react react-dom
```

Mount the provider near the article:

```tsx
import { Callout, PostkitProvider } from '@postkit/react';
import { postkitDefaultTheme } from '@postkit/react/theme';

export function Article() {
  return (
    <PostkitProvider preset={postkitDefaultTheme}>
      <article>
        <h1>My first PostKit article</h1>
        <Callout title="Portable by default" tone="tip">
          Keep the content. Change the renderer.
        </Callout>
      </article>
    </PostkitProvider>
  );
}
```

The preset gives a standalone article PostKit's visual defaults. In an existing
Chakra application, omit `preset` and pass the site's system through `system`.
PostKit then uses the host's component recipes for headings, links, buttons,
inputs, tables, tabs, code, and other primitives. Add PostKit's preset only when
its content-specific visual defaults are wanted.

## Add Markdown or MDX

Use the supplied component map with the application's Markdown or MDX runtime:

```tsx
import { createPostkitMdxComponents } from '@postkit/react';

export const mdxComponents = createPostkitMdxComponents();
```

Framework packages add native routing and framework-specific behavior around
this same map. Continue with [choosing a package](/docs/choosing-a-package) to
select one.

## Keep sensitive work on the server

Link previews and social metadata can require network access or provider
credentials. Resolve them with `@postkit/unfurl` in a server or build-time
boundary, then pass normalized data to the renderer.
