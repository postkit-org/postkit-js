---
title: Chakra
summary: Render Postkit components with @postkit/chakra, the Chakra UI renderer, and configure it through PostkitProvider.
category: Renderers
order: 2
---

`@postkit/chakra` is the Chakra UI renderer for React. It has a Chakra-backed
view for every built-in component, supplies the Markdown and MDX tooling, and
ships Postkit's optional visual preset. The framework adapters (Next.js, React
Router, TanStack Router, and Astro) render through it.

`@postkit/chakra` was named `@postkit/react` before 0.3.0. From 0.3.0,
[`@postkit/react`](/docs/headless) is the headless renderer, and the Chakra
components moved here unchanged: replace the dependency and update your
imports.

```sh
npm install @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

It needs React 19 and Chakra UI `>=3.29.0 <4`.

## Use it with createPostkit

Pass `chakra` as the renderer to [`createPostkit`](/docs/create-postkit):

```ts
// lib/postkit.ts
import { chakra } from '@postkit/chakra';
import { createPostkit } from '@postkit/react';
import { article, media } from '@postkit/react/kits';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, media],
  defaults: { Callout: { variant: 'plain' } },
});
```

`postkit.Provider` then takes `PostkitProvider`'s props, described below.
Theme-variant `defaults` (`variant`, `size`, `tone`…) are written into the
recipes' `defaultVariants`, and other defaults become view defaults (see
[Defaults and slots](/docs/defaults-and-slots)).

## Entry points

| Import                                    | Contains                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `@postkit/chakra`                         | Components, `chakra`, `PostkitProvider`, the MDX map, recipes, theme |
| `@postkit/chakra/theme`                   | `createPostkitSystem`, `createPostkitTheme`, `postkitDefaultTheme`   |
| `@postkit/chakra/remark`                  | `createPostkitRemarkPlugins` and the Remark transform                |
| `@postkit/chakra/document`                | `DocumentRenderer` and the `@postkit/core` parsers and serializers   |
| `@postkit/chakra/component-manifest.json` | The generated component manifest                                     |

The focused entry points keep React components out of theme libraries and
build-only Markdown tooling.

## The provider

Render articles beneath `PostkitProvider`. It supplies Chakra context and the
site-wide Postkit configuration:

- `system`: the site's Chakra system. Its tokens, recipes, and global styles
  are preserved.
- `preset`: optional visual defaults beneath the system. Pass
  `postkitDefaultTheme` for Postkit's standalone appearance.
- `theme`: scoped overrides from `createPostkitTheme`, applied last.
- `codeBlock` and `codeBlockAdapter`: code-block defaults and an optional
  syntax highlighter (see [MDX](/docs/mdx)).
- `resolver` or `resolvers`, with `defaultResolver`: runtime link resolution
  for `LinkPreview` (see [Link previews](/docs/link-previews)).
- `figures` and `figureLabel`: `figures="numbered"` numbers Figure, Video and
  Device ("Fig. 1", "Fig. 2") in reading order.

```tsx
import { PostkitProvider } from '@postkit/chakra';

<PostkitProvider system={siteSystem}>{article}</PostkitProvider>;
```

Without a `system`, `PostkitProvider` uses Chakra's `defaultSystem`, so it
imports Chakra's complete theme, every built-in recipe included. If your system
registers only the recipes you render (built on `defaultBaseConfig`), use
`PostkitHostProvider` instead. It takes the same props with `system` required
and never imports `defaultSystem`, so the unused recipes stay out of your
bundle.

## Styling modes

- Host-native: pass the site's `system` and omit `preset`. The host's Chakra
  recipes control presentation.
- Standalone preset: pass `preset={postkitDefaultTheme}` for Postkit's complete
  visual treatment, including its dark CodeBlock, CodeGroup, and Terminal
  palettes.
- Scoped customization: add `theme={createPostkitTheme(...)}` to either mode.

[Tokens](/docs/tokens) covers the layering, and [Part styles](/docs/part-styles)
covers per-part overrides.

## Recipes and views

Each component's look is a Chakra slot recipe, exported as
`postkit<Name>Recipe` (such as `postkitCalloutRecipe`) with its part names as
`postkit<Name>Slots` (Aside shares Callout's), and registered under the recipe key
`postkit<Name>`. The parts carry the same `data-postkit-*` anatomy attributes
as the [headless](/docs/headless) views, so selectors written for one work
for the other.

To replace a component's render, build a view with `postkitChakraView`, which
takes the definition, the recipe and a render function (see
[Views](/docs/views)). To start from Postkit's own view instead, eject it with
`npx postkit eject <name> --renderer chakra` (see [Eject](/docs/eject)).

## Presentation props

Portable components share compact presentation controls:

- `size`: `sm`, `md`, or `lg`
- `variant`: `outline`, `subtle`, or `plain`

Site-wide visual decisions belong in the Chakra system or Postkit theme rather
than repeated content props. The [component catalog](/components) lists every
component with live previews, its props, and its directive syntax.

## Rendering documents

To render a portable document (from HTML, Markdown, MDX, or JSON) rather than
compiled MDX, use `DocumentRenderer` from `@postkit/chakra/document`. See
[Portable documents and feeds](/docs/portable-documents).
