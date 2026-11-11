---
title: Quick start
summary: Mount the provider, render a first portable article component, and connect Markdown or MDX.
category: Get started
order: 3
---

Postkit gives articles a portable component vocabulary while leaving the host
application in control of routing, layout, assets, and remote services. This
page uses the Chakra UI renderer (see [Installation](/docs/installation)); the
[headless renderer](#headless-instead) works the same way.

## Configure Postkit

Choose the [kits](/docs/kits) your writers need, and the renderer:

```ts
// lib/postkit.ts
import { chakra } from '@postkit/chakra';
import { createPostkit } from '@postkit/react';
import { article, media, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
});
```

[`createPostkit`](/docs/create-postkit) returns the provider, the MDX map, the
Remark plugins and the [manifest](/docs/manifest) for exactly that set.

## Render a first component

Mount the provider near the article:

```tsx
import { Callout } from '@postkit/chakra';
import { postkitDefaultTheme } from '@postkit/chakra/theme';

import { postkit } from './lib/postkit';

export function Article() {
  return (
    <postkit.Provider preset={postkitDefaultTheme}>
      <article>
        <h1>My first Postkit article</h1>
        <Callout title="Portable by default" tone="tip">
          Keep the content. Change the renderer.
        </Callout>
      </article>
    </postkit.Provider>
  );
}
```

With `renderer: chakra`, `postkit.Provider` is Chakra's `PostkitProvider`
with your site's defaults and overrides, and takes the same props.

The preset gives a standalone article Postkit's visual defaults. In an existing
Chakra application, omit `preset` and pass the site's system through `system`.
Postkit then uses the host's component recipes for headings, links, buttons,
inputs, tables, tabs, code, and other primitives. Add Postkit's preset only when
its content-specific visual defaults are wanted. [Tokens](/docs/tokens) explains
the layering.

## Add Markdown or MDX

Pass the component map and the Remark plugins to the application's Markdown or
MDX runtime:

```ts
import { postkit } from './lib/postkit';

export const mdxOptions = { remarkPlugins: postkit.remarkPlugins };
export const mdxComponents = postkit.mdxComponents;
```

The map holds only the components your kits enable, and the plugins
[validate](/docs/validation) directives and component names against the same
set, so a post that uses a component you didn't turn on fails the build.

Framework packages add native routing and framework-specific behavior around
this same map. `@postkit/next`, `@postkit/react-router` and
`@postkit/tanstack-router` each export a `createPostkit` that sets the
framework's link for you. Pick yours under Frameworks: [Next.js](/docs/nextjs),
[React Router](/docs/react-router), [TanStack Router](/docs/tanstack-router),
or [Astro](/docs/astro).

Write components as JSX in [MDX](/docs/mdx), or as literal-only
[Markdown directives](/docs/markdown-directives) in plain Markdown.

## Headless instead

To style the components yourself, with no Chakra or Emotion, leave out
`renderer`, and the views come from `@postkit/react`:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, media, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  kits: [article, technical, media],
});
```

For a quiet starting look, import the optional baseline stylesheet once, at
your app's root:

```ts
import '@postkit/react/styles.css';
```

See [Headless](/docs/headless) for the install and styling.

## Keep sensitive work on the server

Link previews and social metadata can require network access or provider
credentials. Resolve them with `@postkit/unfurl` in a server or build-time
boundary, then pass normalized data to the renderer. See
[Link previews and unfurling](/docs/link-previews).
