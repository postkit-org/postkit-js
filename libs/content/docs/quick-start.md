---
title: Quick start
summary: Mount the provider, render a first portable article component, and connect Markdown or MDX.
category: Get started
order: 3
---

# Quick start

Postkit gives articles a portable component vocabulary while leaving the host
application in control of routing, layout, assets, and remote services. This
page assumes the React renderer is installed (see
[Installation](/docs/installation)).

## Render a first component

Mount the provider near the article:

```tsx
import { Callout, PostkitProvider } from '@postkit/chakra';
import { postkitDefaultTheme } from '@postkit/chakra/theme';

export function Article() {
  return (
    <PostkitProvider preset={postkitDefaultTheme}>
      <article>
        <h1>My first Postkit article</h1>
        <Callout title="Portable by default" tone="tip">
          Keep the content. Change the renderer.
        </Callout>
      </article>
    </PostkitProvider>
  );
}
```

The preset gives a standalone article Postkit's visual defaults. In an existing
Chakra application, omit `preset` and pass the site's system through `system`.
Postkit then uses the host's component recipes for headings, links, buttons,
inputs, tables, tabs, code, and other primitives. Add Postkit's preset only when
its content-specific visual defaults are wanted. [Tokens](/docs/tokens) explains
the layering.

## Add Markdown or MDX

Use the supplied component map with the application's Markdown or MDX runtime:

```tsx
import { createPostkitMdxComponents } from '@postkit/chakra';

export const mdxComponents = createPostkitMdxComponents();
```

Framework packages add native routing and framework-specific behavior around
this same map. Pick yours under Frameworks: [Next.js](/docs/nextjs),
[React Router](/docs/react-router), [TanStack Router](/docs/tanstack-router),
or [Astro](/docs/astro).

Write components as JSX in [MDX](/docs/mdx), or as literal-only
[Markdown directives](/docs/markdown-directives) in plain Markdown.

## Keep sensitive work on the server

Link previews and social metadata can require network access or provider
credentials. Resolve them with `@postkit/unfurl` in a server or build-time
boundary, then pass normalized data to the renderer. See
[Link previews and unfurling](/docs/link-previews).
