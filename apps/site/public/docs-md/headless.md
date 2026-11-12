# Headless

Render Postkit components as semantic, named parts and style them with your own CSS.

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
npm install @postkit/react react react-dom
```

It brings the definitions, the behaviour hooks, `createPostkit`, the kits, the
MDX map and the directive plugin with it.

The interactive components and hooks run on [Zag](https://zagjs.com). Zag is
an optional peer dependency, so a Chakra site uses the copy Chakra already
installs and never bundles two. A headless-only site installs it too:

```sh
npm install @zag-js/react @zag-js/core @zag-js/types @zag-js/carousel @zag-js/tabs @zag-js/clipboard
```

The package is ESM-only and supports React 19.

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

Each headless view, with its behaviour, loads the first time a page renders
it, so a page ships only the views its content uses, and each kit brings only
its own definitions. A server render that waits for Suspense has the whole
view in its HTML. For a synchronous render (`renderToStaticMarkup`), pass
`renderer: postkitHeadlessEagerRenderer` (see
[Lazy views](/docs/create-postkit#lazy-views)).

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
next-themes. A light-only site that ignores the reader's setting should mark
its root `class="light"` or `data-theme="light"`, so the components stay light
too. CodeBlock, CodeGroup and Terminal keep their dark surface in both modes.

Set any of these on `:root`, or on any element for a subtree. The stylesheet
declares them with zero specificity, so your own rule wins whatever the order.
Give each colour you change a dark value too.

| Group           | Custom properties                                                                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colour          | `--postkit-color-bg`, `-fg`, `-fg-muted`, `-surface`, `-surface-emphasized`, `-border`, `-border-muted`, `-border-strong`, `-accent`, `-accent-fg`, `-focus-ring`, `-highlight`, `-letterbox`, `-on-letterbox`; `--postkit-color-scheme` (`light` or `dark`) |
| Tone            | `--postkit-tone-{note,tip,important,warning,caution}` and `--postkit-tone-{tone}-surface`                                                                                                                                                                    |
| Chart           | `--postkit-chart-1` to `--postkit-chart-4`, for series without an authored colour                                                                                                                                                                            |
| Code surface    | `--postkit-code-bg`, `-header-bg`, `-selected`, `-border`, `-fg`, `-fg-muted`, `-success`, `-focus-ring`                                                                                                                                                     |
| Type            | `--postkit-font-body` and `--postkit-font-heading` (unset: the host's), `--postkit-font-mono`; `--postkit-text-{xs,sm,md,lg,xl,2xl,3xl,4xl}`; `--postkit-leading`, `--postkit-leading-tight`; `--postkit-weight-{medium,semibold,bold}`                      |
| Space and shape | `--postkit-space-{1,2,3,4,5,6,8}`, `--postkit-space-flow` (between blocks); `--postkit-radius-{sm,md,lg,xl,full}`; `--postkit-border-width`, `--postkit-rule-width`; `--postkit-focus-width`, `--postkit-focus-offset`; `--postkit-duration`                 |
| Footnotes       | `--postkit-footnote-{accent,marker-color,marker-size,number-color,number-size,text-size,text-color,rule,rule-width,target-bg}`, `--postkit-sidenote-width`, `--postkit-sidenote-gap`                                                                         |

```css
:root {
  --postkit-font-heading: 'Fraunces', serif;
  --postkit-color-accent: #3b2f8f;
}
.dark {
  --postkit-color-accent: #c9c1ff;
}
```

Inside a component, `--postkit-inset` (the padding for its size) and
`--postkit-tone` and `--postkit-tone-surface` (its resolved tone) are set on
the root, so your part rules can reuse them.

Every rule in the stylesheet is wrapped in `:where()`, so a single class or
attribute selector beats it. To keep it below your own cascade layers, import
it into one: `@import '@postkit/react/styles.css' layer(postkit);`. It scopes
each component with CSS `@scope`, so a Callout's rules never reach a component
inside it; browsers without `@scope` show the semantic markup unstyled.

## Behaviour

Interactive behaviour, such as carousel paging, code copy, tabs and
consent-to-embed, is written once as a headless hook and shared by every
renderer. Postkit's Chakra views use the same hooks, and both pass the same
behaviour tests.

In 0.3.0 every built-in component has a headless view, the interactive ones
included: `Tabs`, `CodeBlock`, `CodeGroup`, `Carousel`, `Poll`, `LinkPreview`,
`NewsletterSignup`, `ShareActions` and `SocialPost` read their behaviour from
`useTabs`, `useCarousel`, `useCodeCopy`, `useEmbedConsent`, `usePoll`,
`useNewsletterSignup` and `useShareActions`. None is `chakra-only`.
Footnotes use `useFootnotes` for their placement (see
[Footnotes](/docs/footnotes)).

The hooks are exported, so you can build your own interactive views on the
same behaviour. Each returns the state plus prop getters to spread onto your
elements:

```tsx
import { useTabs } from '@postkit/react';

function Install() {
  const api = useTabs({ values: ['npm', 'pnpm'] });
  return (
    <div {...api.getRootProps()}>
      <div {...api.getListProps()} aria-label="Install">
        <button {...api.getTriggerProps({ value: 'npm' })}>npm</button>
        <button {...api.getTriggerProps({ value: 'pnpm' })}>pnpm</button>
      </div>
      <div {...api.getContentProps({ value: 'npm' })}>npm install</div>
      <div {...api.getContentProps({ value: 'pnpm' })}>pnpm add</div>
    </div>
  );
}
```

The headless package has no provider of its own, so views that need host
configuration take it as props: `LinkPreview` and `SocialPost` take
`resolveLink` and `socialServices`, `NewsletterSignup` takes `newsletter`,
`ShareActions` takes `socialServices` and `onShare`, and `Poll` takes
`onVote`.
