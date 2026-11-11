# createPostkit

Configure the components, renderer, defaults and overrides a site uses, in one call.

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

| Option       | Description                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderer`   | The renderer that supplies the views. Pass `chakra` from `@postkit/chakra` for the Chakra views. Omit it for the headless views.                                                                          |
| `kits`       | The [kits](/docs/kits) to enable, such as `[article, technical]` from `@postkit/react/kits`.                                                                                                              |
| `exclude`    | Component names to leave out of the enabled kits, such as `['Poll']`.                                                                                                                                     |
| `components` | Your own components and third-party ones, as `{ definition, view }` pairs. See [New components](/docs/new-components).                                                                                    |
| `defaults`   | Site-wide prop defaults, keyed by component name. See [Defaults and slots](/docs/defaults-and-slots).                                                                                                     |
| `overrides`  | Per-component slot and view overrides, keyed by component name.                                                                                                                                           |
| `link`       | The link component for internal links, such as Next.js `Link`. The framework adapters set it for you.                                                                                                     |
| `remark`     | Options for the Remark preset, such as `{ postkit: { strict: false } }` or `{ postkit: { footnotes: { defaults } } }` ([Footnotes](/docs/footnotes)). Directives always validate against the enabled set. |

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
| `postkit.remarkPlugins` | The Remark plugins for MDX and Markdown. Directives validate against this set.                                                           |
| `postkit.manifest()`    | The `postkit.component-catalog` v2 [manifest](/docs/manifest) for this set.                                                              |
| `postkit.definitions`   | The enabled definitions that render with this renderer. Pass them to `renderEmail` ([Email](/docs/email)).                               |
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
