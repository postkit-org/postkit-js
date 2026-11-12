---
title: createPostkit
summary: Configure the components, renderer, defaults and overrides a site uses, in one call.
category: Reference
order: 1
since: '0.3.0'
status: published
---

`createPostkit` configures everything a host needs from the set of components
it actually uses: the provider, the MDX map and the manifest, plus the
directive plugins through `postkitRemarkPlugins`.

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

| Option       | Description                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderer`   | The renderer that supplies the views. Pass `chakra` or `chakraLazy` from `@postkit/chakra` for the Chakra views. Omit it for the headless views, which load on first render ([Lazy views](#lazy-views)). |
| `kits`       | The [kits](/docs/kits) to enable, such as `[article, technical]` from `@postkit/react/kits`.                                                                                                             |
| `exclude`    | Component names to leave out of the enabled kits, such as `['Poll']`.                                                                                                                                    |
| `components` | Your own components and third-party ones, as `{ definition, view }` pairs. See [New components](/docs/new-components).                                                                                   |
| `defaults`   | Site-wide prop defaults, keyed by component name. See [Defaults and slots](/docs/defaults-and-slots).                                                                                                    |
| `overrides`  | Per-component slot and view overrides, keyed by component name.                                                                                                                                          |
| `link`       | The link component for internal links, such as Next.js `Link`. The framework adapters set it for you.                                                                                                    |

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

`createPostkit` checks the object when it runs, and throws for a component
that isn't enabled, a prop it doesn't have, or a value the prop doesn't
allow.

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
`classNames`. A part name the component doesn't have throws, and the error
lists its parts. A view not built with `postkitView` or `postkitChakraView`
can't take `classNames` or `slots` overrides (see
[Defaults and slots](/docs/defaults-and-slots)).

`createPostkit` also throws when two kits or components define the same name
or directive, when `exclude` names something that isn't enabled, and when a
`components` entry repeats an enabled component. To replace a built-in
component's view, use `overrides.Name.view`.

## Returns

| Property                | Description                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `postkit.Provider`      | The renderer's provider (Chakra's `PostkitProvider` with `renderer: chakra`) with your defaults and overrides. Wrap your app in it once. |
| `postkit.mdxComponents` | Only the enabled components, plus prose. Pass it to your MDX runtime.                                                                    |
| `postkit.manifest()`    | The `postkit.component-catalog` v2 [manifest](/docs/manifest) for this set.                                                              |
| `postkit.definitions`   | The enabled definitions that render with this renderer. Pass them to `renderEmail` ([Email](/docs/email)).                               |
| `postkit.unavailable`   | Enabled components the renderer has no view for, with the reason. `postkitRemarkPlugins` fails the build on one.                         |
| `postkit.renderer`      | The renderer in use.                                                                                                                     |

With `renderer: chakra`, `postkit.Provider` takes `PostkitProvider`'s props,
such as `system`, `preset` and `theme` (see [Chakra](/docs/chakra)). With
either renderer it also takes `figures="numbered"`, which numbers Figure,
Video and Device in reading order ("Fig. 1", "Fig. 2"). A Carousel or Gallery
counts as one figure whose items read "Fig. 3", "Fig. 3b", "Fig. 3c".
`figureLabel` changes "Fig.":

```tsx
<postkit.Provider figures="numbered" figureLabel="Figure">
  {children}
</postkit.Provider>
```

## Remark plugins

The Remark plugins come from `postkitRemarkPlugins` in
`@postkit/react/remark`, not from `postkit` itself, so the Markdown tooling
(GFM, directives, Postkit's plugin) stays out of the browser bundle. Call it
where Markdown compiles: an MDX loader, `getStaticProps`, a build script.
Directives and component names validate against exactly the enabled set:

```ts
import { postkitRemarkPlugins } from '@postkit/react/remark';
import { postkit } from './lib/postkit';

export const remarkPlugins = postkitRemarkPlugins(postkit, {
  postkit: { strict: false },
});
```

The second argument takes the preset's options, such as
`{ postkit: { footnotes: { defaults } } }` ([Footnotes](/docs/footnotes)) or
`{ gfm: false }`.

## Lazy views

Without `renderer`, `createPostkit` uses `postkitHeadlessRenderer`: each
headless view, with its behaviour (a Zag machine for Carousel and Tabs, say),
downloads the first time a page renders it, so a page ships only the views
its content uses. `chakraLazy` does the same for the Chakra views. A server
render that waits for Suspense (Next.js, React Router, TanStack Start, Astro)
has the whole view in its HTML, and the browser keeps that HTML until the
view arrives, so nothing shifts.

A synchronous render (`renderToStaticMarkup`) renders a view that hasn't
loaded as nothing. Either load the views first with
`preloadPostkitViews(postkit.mdxComponents, names)`, or use the eager
renderers, which import every view up front: `postkitHeadlessEagerRenderer`
from `@postkit/react`, or `chakra` from `@postkit/chakra`.

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
import { chakraLazy } from '@postkit/chakra';

export const postkit = createPostkit({
  renderer: chakraLazy,
  kits: [article, technical, media],
  link: { linkProps: { prefetch: false } },
});
```

The low-level exports stay available: `createPostkitNextComponents()`,
`createPostkitReactRouterComponents()` and
`createPostkitTanStackRouterComponents()`, plus each adapter's link
(`createPostkitNextLink()` and so on). Their component maps load each view
on first render too; pass `components: postkitChakraViews` for a synchronous
render.
