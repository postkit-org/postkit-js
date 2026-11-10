---
title: Headless
summary: Render Postkit components as semantic, named parts and style them with your own CSS.
category: Renderers
order: 1
since: '0.3.0'
status: draft
---

`@postkit/react` is the headless renderer. Its views emit semantic markup,
landmarks and ARIA with a name on every part, and nothing else. You bring the
look with plain CSS, utility classes or any CSS-in-JS. There's no Chakra and no
Emotion in the bundle.

:::postkit-callout{tone="important" title="Upgrading from 0.2"}
From 0.3.0, `@postkit/react` is headless. The Chakra components that
`@postkit/react` exported in 0.2 are now in `@postkit/chakra`. To keep today's
look, install `@postkit/chakra` and change your imports. There's no
compatibility shim.
:::

## Install

```sh
npm install @postkit/react
```

It brings the definitions, the behaviour hooks, `createPostkit`, the kits, the
MDX map and the directive plugin with it.

## Set up

Leave out `renderer` and `createPostkit` uses the headless views:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  kits: [article, technical],
});
```

Wrap your app in `postkit.Provider` and pass `postkit.mdxComponents` to MDX,
as in the [Quick start](/docs/quick-start).

## Every part has a name

Every headless view stamps the component name on its root and a part name on
each part, along with its state:

```html
<aside
  data-postkit-component="Callout"
  data-postkit-part="root"
  data-tone="tip"
  data-size="md"
  data-variant="subtle"
>
  <span data-postkit-part="icon" aria-hidden="true">…</span>
  <div data-postkit-part="content">…</div>
</aside>
```

State follows the Ark UI conventions Chakra v3 uses, such as
`data-state="open"`, `data-current` and `data-tone`. The Chakra renderer emits
the same attributes, so selectors you write for one work for the other.

## Style it

Target parts with attribute selectors:

```css
[data-postkit-component='Callout'] [data-postkit-part='icon'] {
  color: var(--brand);
}
```

Or pass class names per part, which suits Tailwind and other utility CSS. They
are applied alongside the part names, so the two approaches mix. See
[Part styles](/docs/part-styles) for both.

## The optional stylesheet

Headless doesn't mean unstyled by force. `@postkit/react/styles.css` is a
small, optional baseline with a quiet, neutral look: structure, prose rhythm
and restrained monochrome. Every value in it is a `--postkit-*` custom
property, so you can retune it with [tokens](/docs/tokens) instead of
overriding rules.

```ts
import '@postkit/react/styles.css';
```

Load your own CSS after it, or leave it out and start from bare, named parts.

The stylesheet follows the reader's colour mode. Its custom properties get dark
values under `prefers-color-scheme: dark`, and under `.dark` and
`[data-theme="dark"]` for hosts that switch themes with a class, such as
next-themes.

{/* TODO(0.3.0): link or list the full set of --postkit-* custom properties once styles.css lands. */}

## Behaviour

Interactive behaviour, such as carousel paging, code copy, tabs and
consent-to-embed, is written once as a headless hook and shared by every
renderer. Postkit's Chakra views use the same hooks, and both pass the same
behaviour tests.

In 0.3.0 every static component has a headless view. An interactive component
whose behaviour hasn't moved into the shared hooks yet is marked `chakra-only`
in the manifest and its component page, and needs the Chakra renderer for now.

{/* TODO(0.3.0): list the components that are chakra-only at release (03 D11 consequence; Poll is likely, since its behaviour isn't in 03 §8 step 6). */}

## Who uses it

Prismark's editor previews render with `@postkit/react` and `styles.css`, so
writers see the same parts your site styles. See
[Writing in Prismark](/docs/writing-in-prismark).
