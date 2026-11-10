---
title: createPostkit
summary: Configure the components, renderer, defaults and overrides a site uses, in one call.
category: Reference
order: 1
since: '0.3.0'
status: draft
---

`createPostkit` configures everything a host needs from the set of components
it actually uses: the provider, the MDX map, the directive plugins and the
manifest.

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, technical, media } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra'; // omit for headless views
import NextLink from 'next/link';

import { showcaseDefinition, Showcase } from './components/showcase';
import { CommuneFigure } from './components/figure';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
  exclude: ['Poll'],
  components: [{ definition: showcaseDefinition, view: Showcase }],
  defaults: { Callout: { variant: 'plain' } },
  overrides: {
    Figure: { view: CommuneFigure },
  },
  link: NextLink,
});
```

## Options

| Option       | Description                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `renderer`   | The renderer that supplies the views. Pass `chakra` from `@postkit/chakra` for the Chakra views. Omit it for the headless views. |
| `kits`       | The [kits](/docs/kits) to enable, such as `[article, technical]` from `@postkit/react/kits`.                                     |
| `exclude`    | Component names to leave out of the enabled kits, such as `['Poll']`.                                                            |
| `components` | Your own components and third-party ones, as `{ definition, view }` pairs. See [New components](/docs/new-components).           |
| `defaults`   | Site-wide prop defaults, keyed by component name. See [Defaults and slots](/docs/defaults-and-slots).                            |
| `overrides`  | Per-component slot and view overrides, keyed by component name.                                                                  |
| `link`       | The link component for internal links, such as Next.js `Link`. The framework adapters set it for you.                            |
| `remark`     | Options for the Remark preset, such as `{ postkit: { strict: false } }`. Directives always validate against the enabled set.     |

### `defaults`

```ts
defaults: {
  Callout: { variant: 'plain' },
}
```

A prop an author writes always wins. With `@postkit/chakra`, theme-variant
props (`variant`, `size`, `tone`) are written into the recipe's
`defaultVariants`; other props become the view's defaults. The same object
works with the headless renderer.

### `overrides`

Each key is a component name. Each value can set:

| Key          | Rung | Description                                                                                                   |
| ------------ | ---- | ------------------------------------------------------------------------------------------------------------- |
| `classNames` | 3    | Class names per part, applied alongside the part names. See [Part styles](/docs/part-styles).                 |
| `slots`      | 5    | Components that replace single parts, keyed by part name. See [Defaults and slots](/docs/defaults-and-slots). |
| `view`       | 6    | A view that replaces the whole render. See [Views](/docs/views).                                              |

```ts
overrides: {
  Callout: {
    classNames: { root: 'rounded-sm border-l-4', title: 'font-display' },
    slots: { icon: InkMark },
  },
  Figure: { view: CommuneFigure },
}
```

Site `classNames` come first on each part, then an instance's own
`classNames`.

## Returns

| Property                | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `postkit.Provider`      | A `PostkitProvider` bound to this set and its overrides. Wrap your app in it once. |
| `postkit.mdxComponents` | Only the enabled components, plus prose. Pass it to your MDX runtime.              |
| `postkit.remarkPlugins` | The Remark plugins for MDX and Markdown. Directives validate against this set.     |
| `postkit.manifest()`    | The `postkit.component-catalog` v2 [manifest](/docs/manifest) for this set.        |
| `postkit.definitions`   | The enabled definitions that render with this renderer.                            |

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { postkit } from '../lib/postkit';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <postkit.Provider>
      <Component {...pageProps} />
    </postkit.Provider>
  );
}
```

## Framework adapters

`@postkit/next`, `@postkit/react-router` and `@postkit/tanstack-router` each
export a `createPostkit` preset. It takes the same options and returns the
same result, with `link` set to the framework's link; pass link options (or
your own component) as `link`. Image optimisation stays the host's job.

```ts
import { createPostkit } from '@postkit/next';
import { article, technical, media } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
  link: { linkProps: { prefetch: false } },
});
```

The low-level exports stay available: `createPostkitNextComponents()`,
`createPostkitReactRouterComponents()` and
`createPostkitTanStackRouterComponents()`, plus each adapter's link
(`createPostkitNextLink()` and so on).
