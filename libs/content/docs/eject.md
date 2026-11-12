---
title: Eject
summary: Copy a component's view into your repo to own it, while its contract stays upstream.
category: Customizing
order: 5
since: '0.3.0'
status: published
---

Ejecting is rung 7 of the customization ladder. It copies a component's view
(and its recipe, for Chakra) into your repo, so you own the source and can
change anything in it.

Unlike copying a component by hand, the contract stays upstream. An ejected
`Figure` still imports `figureDefinition` from `@postkit/core`, so its
directive, validation and manifest entry don't fork, and your posts, Prismark
and the email renderer keep treating it as a Figure.

## Eject a component

```sh
npx postkit eject figure --renderer chakra --to libs/postkit
```

```text
✓ libs/postkit/figure/figure.recipe.ts
✓ libs/postkit/figure/figure.tsx
✓ .postkit-eject.json   Figure @ @postkit/chakra 0.3.0
✓ lib/postkit.ts   overrides.Figure.view → ../libs/postkit/figure/figure

Still bound to Figure's definition from @postkit/core/components.
It imports @postkit/chakra, @postkit/core, @postkit/react; keep them in your dependencies.
Chakra applies the recipe registered as postkitFigure first: register the ejected recipe in your theme to use your edits (see /docs/eject).
Run `postkit diff figure` after upgrading @postkit/chakra.
```

The CLI copies that renderer's view from your installed `@postkit/chakra` or
`@postkit/react`, plus the recipe for Chakra and the CSS for headless, and
registers the copy as the component's [view](/docs/views) override in your
Postkit config:

```ts
// lib/postkit.ts
import { Figure } from '../libs/postkit/figure/figure';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, media],
  overrides: { Figure: { view: Figure } },
});
```

It writes the import path the way your config already writes relative
imports, with `.js` if it uses `.js`. If it can't find your config, or can't
edit it safely, it prints those lines for you to add. See [CLI](/docs/cli#your-config) for how it finds the config
and for every flag.

| Flag            | Default       | Meaning                               |
| --------------- | ------------- | ------------------------------------- |
| `--renderer`    | from config   | `headless` or `chakra`                |
| `--to`          | `src/postkit` | Where the component's folder goes     |
| `--dry-run`     | `false`       | Show the files and config change only |
| `--force`       | `false`       | Overwrite files that already exist    |
| `--no-register` | registers     | Leave your config alone               |

### What the copy imports

The copied view imports its definition from `@postkit/core/components` and
helpers from the renderer package's public API (`@postkit/chakra`,
`@postkit/react`), so keep those in your dependencies. If a view needs a small
internal helper the package doesn't export, the helper is copied into an
`internal/` folder beside it.

### Using an ejected Chakra recipe

The ejected view passes its recipe to `postkitChakraView`, but Chakra uses the
recipe your system registers as `postkitFigure` first, and
`postkitDefaultTheme` registers Postkit's. To style the component with your
copy, register it last:

```tsx
import { defineConfig } from '@chakra-ui/react';
import { postkitDefaultTheme } from '@postkit/chakra';

import { postkitFigureRecipe } from '../libs/postkit/figure/figure.recipe';

const theme = defineConfig({
  theme: { slotRecipes: { postkitFigure: postkitFigureRecipe } },
});

<postkit.Provider preset={postkitDefaultTheme} theme={theme}>
  {children}
</postkit.Provider>;
```

## What stays upstream

| Ejected into your repo | Stays in Postkit                                      |
| ---------------------- | ----------------------------------------------------- |
| The view               | The definition: props, directive, anatomy, validation |
| The recipe (Chakra)    | Behaviour, such as carousel paging or code copy       |
| The CSS (headless)     | The manifest entry                                    |

Behaviour lives in `@postkit/core/behaviors` and the renderer's hooks, so an
ejected interactive component keeps getting behaviour fixes when you upgrade.
And because the directive is validated against the upstream definition, a
post that passes a bad prop to `::postkit-figure` still fails the build with
your view in place.

## Keep up with upstream

`postkit eject` records what it copied in `.postkit-eject.json` at your
project root: the package, the version, a content hash and the upstream source
of each file. Commit it.

After an upgrade, `postkit diff` compares that recorded source with the
installed version's and prints a unified diff of what changed upstream, so
you can decide what to bring across. It never changes your copy, and it lists
the files you've edited since ejecting.

```sh
npx postkit diff figure
```

```text
Figure (chakra) in libs/postkit/figure: @postkit/chakra 0.3.0 → 0.3.2
--- a/figure.tsx	@postkit/chakra@0.3.0
+++ b/figure.tsx	@postkit/chakra@0.3.2
@@ -59,7 +59,7 @@
           alt={alt}
           htmlWidth={postkitImageDimension(props.width)}
           htmlHeight={postkitImageDimension(props.height)}
-          loading={props.loading}
+          loading={props.priority ? 'eager' : props.loading}
           decoding="async"
           sizes={props.sizes}
           srcSet={props.srcSet}

1 file changed upstream. Your copy wasn't changed.
Your edits: figure.recipe.ts.
```

When you've brought across what you want, `postkit diff figure --accept`
records the installed version as your new base, and your copy as it is now,
so later edits show against it. In CI, `postkit diff --exit-code` exits with
1 when an ejected component has upstream changes you haven't accepted.

## Before you eject

Ejecting is the last step before writing your own component. Most changes fit
lower on the ladder, where upgrades land without a diff:

- A different look: [Part styles](/docs/part-styles).
- Different defaults, or one part swapped: [Defaults and slots](/docs/defaults-and-slots).
- A new structure written from scratch: [Views](/docs/views).

See [CLI](/docs/cli) for every command.
