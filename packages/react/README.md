# `@postkit/react`

Headless, styleable React views for Postkit components. Each view renders the
component's semantic markup and its **anatomy**, and no styles: no Chakra, no
Emotion, no CSS-in-JS.

> **Coming from `@postkit/react` 0.2?** From 0.3.0 this package is headless.
> Today's styled components moved to
> [`@postkit/chakra`](https://github.com/postkit-org/postkit-js/tree/main/packages/chakra#readme) unchanged: replace the dependency and
> update imports.

This package is new in 0.3.0. It ships headless views for all 38 built-in
components, the behaviour hooks the interactive ones are built on, and
`postkitView` for building views from any `@postkit/core/components`
definition:

- **Article structure:** `Callout`, `Aside`, `Figure`, `CardGrid`, `Disclosure`,
  `Gallery`, `Steps`, `Tabs`, `Footnote`, `Footnotes` (placement `end`,
  `side`, `popover` or `inline`, or one per breakpoint, through
  `useFootnotes`)
- **Technical content:** `CodeBlock`, `CodeGroup`, `Terminal`, `Diff`,
  `FileTree`, `FileCard`
- **Publication:** `PullQuote`, `KeyTakeaway`, `Stat`, `Comparison`,
  `ProductCard`, `RelatedContent`, `SeriesNavigation`, `SponsorBlock`,
  `AudienceBoundary`
- **Media and discovery:** `AppearsOn`, `Audio`, `AuthorCard`, `CallToAction`,
  `Carousel`, `Chart`, `Device`, `LinkPreview`, `SocialPost`, `Video`
- **Engagement:** `Poll`, `NewsletterSignup`, `ShareActions`

The nine interactive views (`Tabs`, `CodeBlock`, `CodeGroup`, `Carousel`,
`Poll`, `LinkPreview`, `NewsletterSignup`, `ShareActions`, `SocialPost`) read
their behaviour from the [hooks](#behaviour-hooks) below and pass the same
shared behaviour specs as their `@postkit/chakra` views. No built-in component
is Chakra-only any more: the `chakraOnly` export is kept as an empty, frozen
array so code that reads it keeps working.

## Install

```sh
npm install @postkit/react react react-dom
```

The interactive components and hooks run on [Zag](https://zagjs.com). If your
site uses `@postkit/chakra` (or Chakra UI), Zag is already installed through
Chakra and Postkit uses that same copy. Headless-only sites install it too:

```sh
npm install @zag-js/react @zag-js/core @zag-js/types @zag-js/carousel @zag-js/tabs @zag-js/clipboard
```

The Zag packages are optional peer dependencies so a Chakra site never ends up
with two copies (03 D7).

The package is ESM-only, includes TypeScript declarations, and supports
React 19. The behaviour hooks run on [Zag](https://zagjs.com) machines, which
`@postkit/react` takes as peer dependencies (`@zag-js/react`, `@zag-js/tabs`,
`@zag-js/carousel`, `@zag-js/clipboard`, `@zag-js/core`, `@zag-js/types`, all
`^1.27.0`). npm installs them for you; in a Chakra UI host they resolve to the
copy Chakra already uses, so the page bundles Zag once.

## Render a component

```tsx
import { Callout, Figure } from '@postkit/react';

<Callout tone="tip" title="Keep the content">
  Change the renderer without changing the article.
</Callout>;

<Figure src="/studio.jpg" alt="The studio" caption="Final session." />;
```

The Callout renders:

```html
<aside
  data-postkit-component="Callout"
  data-postkit-part="root"
  data-size="md"
  data-variant="subtle"
  data-tone="tip"
  data-postkit-tone="tip"
>
  <span data-postkit-part="icon" aria-hidden="true">✓</span>
  <div data-postkit-part="content">
    <p data-postkit-part="title">Keep the content</p>
    <div data-postkit-part="body">
      Change the renderer without changing the article.
    </div>
  </div>
</aside>
```

`@postkit/chakra` stamps the same attributes on the same parts, so selectors
written against the anatomy work with either renderer.

## Styling

The views ship no styles. For a quiet, neutral starting point, import the
optional baseline once, at your app's root:

```ts
import '@postkit/react/styles.css';
```

It styles all 38 built-in components: structure, prose rhythm and restrained
monochrome, with `subtle` (the default), `outline` and `plain` variants, `sm`,
`md` and `lg` sizes, and Callout tones. It is built only from the anatomy
attributes and `--postkit-*` custom properties, and follows the colour mode:

- dark values apply under `@media (prefers-color-scheme: dark)`, unless the
  root has `class="light"` or `data-theme="light"`;
- and under `.dark` or `[data-theme="dark"]`, for class-based hosts such as
  next-themes. A `.light` or `[data-theme="light"]` subtree inside a dark page
  switches back.

A light-only site that ignores the reader's OS setting should mark its root
`class="light"` (or `data-theme="light"`), so the components stay light too.
CodeBlock, CodeGroup and Terminal keep their own dark surface in both modes.

### Tokens

Set any of these on `:root` (or any element, for a subtree) to retheme every
component. The baseline declares them with zero specificity, so your own rule
wins whatever the order. Give each colour you change a dark value too.

| Group           | Tokens                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colour          | `--postkit-color-bg`, `-fg`, `-fg-muted`, `-surface`, `-surface-emphasized`, `-border`, `-border-muted`, `-border-strong`, `-accent`, `-accent-fg`, `-focus-ring`, `-highlight`, `-letterbox`, `-on-letterbox`; `--postkit-color-scheme` (`light` or `dark`) |
| Tone            | `--postkit-tone-{note,tip,important,warning,caution}` and `--postkit-tone-{tone}-surface`                                                                                                                                                                    |
| Chart           | `--postkit-chart-1` … `--postkit-chart-4`: the view reads them for series without an authored colour, with mid-tone fallbacks (`postkitChartColors`) when unset                                                                                              |
| Code surface    | `--postkit-code-bg`, `-header-bg`, `-selected`, `-border`, `-fg`, `-fg-muted`, `-success`, `-focus-ring`                                                                                                                                                     |
| Type            | `--postkit-font-body` and `--postkit-font-heading` (unset: inherit the host's), `--postkit-font-mono`; `--postkit-text-{xs,sm,md,lg,xl,2xl,3xl,4xl}`; `--postkit-leading`, `--postkit-leading-tight`; `--postkit-weight-{medium,semibold,bold}`              |
| Space and shape | `--postkit-space-{1,2,3,4,5,6,8}`, `--postkit-space-flow` (between blocks); `--postkit-radius-{sm,md,lg,xl,full}`; `--postkit-border-width`, `--postkit-rule-width`; `--postkit-focus-width`, `--postkit-focus-offset`; `--postkit-duration`                 |
| Footnotes       | `--postkit-footnote-{accent,marker-color,marker-size,number-color,number-size,text-size,text-color,rule,rule-width,target-bg}`, `--postkit-sidenote-width`, `--postkit-sidenote-gap`                                                                         |

```css
:root {
  --postkit-font-heading: 'Fraunces', serif;
  --postkit-color-accent: #3b2f8f;
  --postkit-radius-xl: 0.25rem;
}
.dark {
  --postkit-color-accent: #c9c1ff;
}
```

Inside a component, `--postkit-inset` (padding for the size) and
`--postkit-tone` / `--postkit-tone-surface` (the resolved tone) are set on the
root, so part overrides can reuse them.

### Override a part

Every rule is wrapped in `:where()`, so a single class or attribute selector
beats it:

```css
[data-postkit-component='Callout'] [data-postkit-part='icon'] {
  border-radius: 0.25rem;
}
```

Or pass a class with `classNames={{ icon: 'rounded-sm' }}`. To opt one
instance out, pass `unstyled`; to keep the baseline below your own layers, import
it into one: `@import '@postkit/react/styles.css' layer(postkit);`.

The baseline scopes each component with CSS `@scope`, ending at any nested
component, so a Callout's rules never reach a component placed inside it.
Browsers without `@scope` show the semantic markup unstyled.

## Style the anatomy

The root carries `data-postkit-component` and one attribute per theme-variant
prop (`data-tone`, `data-size`, `data-variant`, `data-layout`, …) with the
resolved value, defaults included. Every part carries `data-postkit-part`.

```css
[data-postkit-component='Callout'] {
  border-radius: 0.75rem;
  padding: 1rem;
}
[data-postkit-component='Callout'][data-tone='warning']
  [data-postkit-part='icon'] {
  color: darkorange;
}
```

Every view also accepts:

- `classNames`: a class per part, for utility CSS such as Tailwind
  (`classNames={{ root: 'rounded-xl p-4', icon: 'text-amber-600' }}`).
- `slotStyles`: inline styles per part.
- `rootProps`: attributes for the root element. Its `className` and `style`
  merge after the view's own.
- `unstyled`: marks the root `data-postkit-unstyled` so shared stylesheets can
  skip the instance.

`Figure` applies `aspectRatio`, `objectFit` and `objectPosition` as inline
styles, since they describe the content rather than the theme.

`FileTree` indents each item by its depth with an inline
`padding-inline-start`, and each `Diff` line carries
`data-diff="addition" | "deletion" | "context"`.

`CodeBlock` renders its source as plain-text `<span data-line>` lines, with
`data-highlight` on highlighted ones. Five of its parts also answer to an older
slot name (`filename` to `title`, `control` to `actions`, `copyTrigger` to
`button`, `content` to `scroller`, `codeText` to `lineContent`) and take the
`classNames` and `slotStyles` of both.

## Behaviour hooks

Behaviour is written once, in `@postkit/core/behaviors`, and the hooks are
thin React wrappers over it. Each returns the behaviour's API: state plus prop
getters to spread onto your own elements.

| Hook                  | Behaviour                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `useTabs`             | Tabs: roving focus, arrow, Home and End keys, automatic activation |
| `useCarousel`         | Carousel paging: wrapping buttons, keyboard paging, progress text  |
| `useCodeCopy`         | Copy to clipboard with a timed "copied" state                      |
| `useEmbedConsent`     | Consent before a third-party embed loads (`activation: 'click'`)   |
| `usePoll`             | One vote per poll, results and status                              |
| `useNewsletterSignup` | The signup form's states and host-owned submission                 |
| `useShareActions`     | Native share, copy link, email and configured share services       |

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

`useTabs`, `useCarousel` and `useCodeCopy` are Zag machines configured as
`@postkit/chakra` configures them; the others are plain TypeScript. With
`useEmbedConsent`'s default `click` activation, render the prompt until
`shouldRenderFrame` is true and the frame only after, so nothing from the
embed's origin reaches the page before the reader asks for it. `LinkPreview`
and `SocialPost` work this way.

The views that need host configuration take it as props, since the headless
package has no provider: `LinkPreview` and `SocialPost` take `resolveLink` (an
`@postkit/unfurl` resolver callback) and `socialServices`,
`NewsletterSignup` takes `newsletter`, `ShareActions` takes `socialServices`
and `onShare`, and `Poll` takes `onVote`.

## Build a view from a definition

`postkitView` turns a definition from `@postkit/core/components` (or your own
`definePostkitComponent` definition) into a view. `part(name)` returns
everything a part needs: the anatomy attributes, the `classNames` entry,
`slotStyles` and, on the root, `rootProps`.

```tsx
import { calloutDefinition } from '@postkit/core/components';
import { postkitView } from '@postkit/react';

export const InkCallout = postkitView(calloutDefinition, ({ props, part }) => (
  <aside {...part('root')}>
    <span {...part('icon')} aria-hidden="true">
      ✒
    </span>
    <div {...part('content')}>
      {props.title ? <p {...part('title')}>{props.title}</p> : null}
      <div {...part('body')}>{props.children}</div>
    </div>
  </aside>
));
```

The view applies the definition's defaults to `props`, falls back from enum
values the definition doesn't allow, and in development warns once about a
missing required prop or a value of the wrong kind (`validatePostkitProps`).
`resolvePostkitViewState` and `postkitPartAttributes` expose the same logic
for other renderers.

## Configure a site with `createPostkit`

`createPostkit` configures a site from the set it uses: kits, its own
components, defaults and overrides. Omit `renderer` for these headless views,
or pass `chakra` from `@postkit/chakra`.

```tsx
import { createPostkit, type PostkitSlotProps } from '@postkit/react';
import { article, technical, media } from '@postkit/react/kits';

function InkMark(props: PostkitSlotProps) {
  return <span {...props} className={`ink ${props.className ?? ''}`} />;
}

export const postkit = createPostkit({
  kits: [article, technical, media],
  exclude: ['Gallery'],
  components: [{ definition: showcaseDefinition, view: Showcase }],
  defaults: { Callout: { variant: 'plain' } },
  overrides: {
    Callout: {
      slots: { icon: InkMark },
      classNames: { title: 'font-display' },
    },
  },
});

// postkit.Provider, postkit.mdxComponents, postkit.remarkPlugins, postkit.manifest()
```

- Kits are renderer-neutral lists of definitions: `@postkit/react/kits`, or
  one at a time from `@postkit/react/kits/article`, `/technical`, `/media`,
  `/discovery`, `/engagement` and `/publishing`.
- `defaults` apply beneath `postkit.Provider`; an author's prop always wins.
- `<postkit.Provider figures="numbered">` numbers Figure, Video and Device
  ("Fig. 1", "Fig. 2") in reading order. A Carousel or Gallery is one figure
  whose items read "Fig. 3", "Fig. 3b", "Fig. 3c". `figureLabel` changes
  "Fig.". `@postkit/chakra`'s `PostkitProvider` takes the same props.
- `remarkPlugins` validates directives against the enabled set. A
  `chakra-only` component on the headless renderer fails the build, and
  throws if rendered, with an error naming it.
- The Markdown tooling is also available on its own from
  `@postkit/react/remark`.
