---
title: Chakra
summary: Render Postkit components with @postkit/chakra, the Chakra UI renderer, and configure it through PostkitProvider.
category: Renderers
order: 2
---

# Chakra

`@postkit/chakra` is the Chakra UI renderer for React. It maps every portable
declaration to a Chakra-backed component, supplies the Markdown and MDX
tooling, and ships Postkit's optional visual preset. The framework adapters
(Next.js, React Router, TanStack Router, and Astro) all render through it.

`@postkit/chakra` was previously named `@postkit/react`. The `@postkit/react`
name is reserved for a future generic React renderer without a Chakra
dependency.

```sh
npm install @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

It needs React 19 and Chakra UI `>=3.29.0 <4`.

## Entry points

| Import                                    | Contains                                                           |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `@postkit/chakra`                         | Components, `PostkitProvider`, the MDX map, declarations, theme    |
| `@postkit/chakra/theme`                   | `createPostkitSystem`, `createPostkitTheme`, `postkitDefaultTheme` |
| `@postkit/chakra/remark`                  | `createPostkitRemarkPlugins` and the Remark transform              |
| `@postkit/chakra/document`                | `DocumentRenderer` and the `@postkit/core` parsers and serializers |
| `@postkit/chakra/component-manifest.json` | The generated component manifest                                   |

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

```tsx
import { PostkitProvider } from '@postkit/chakra';

<PostkitProvider system={siteSystem}>{article}</PostkitProvider>;
```

## Styling modes

- Host-native: pass the site's `system` and omit `preset`. The host's Chakra
  recipes control presentation.
- Standalone preset: pass `preset={postkitDefaultTheme}` for Postkit's complete
  visual treatment, including its dark CodeBlock, CodeGroup, and Terminal
  palettes.
- Scoped customization: add `theme={createPostkitTheme(...)}` to either mode.

[Tokens](/docs/tokens) covers the layering, and [Part styles](/docs/part-styles)
covers per-part overrides.

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
