# `@postkit/react`

Headless, styleable React views for Postkit components. Each view renders the
component's semantic markup and its **anatomy**, and no styles: no Chakra, no
Emotion, no CSS-in-JS.

> **Coming from `@postkit/react` 0.2?** From 0.3.0 this package is headless.
> Today's styled components moved to
> [`@postkit/chakra`](https://github.com/postkit-org/postkit-js/tree/main/packages/chakra#readme) unchanged: replace the dependency and
> update imports.

This package is new in 0.3.0. It ships headless views for 26 of the 35
built-in components, plus `postkitView` for building views from any
`@postkit/core/components` definition:

- **Article structure:** `Callout`, `Aside`, `Figure`, `CardGrid`, `Disclosure`,
  `Gallery`, `Steps`
- **Technical content:** `Terminal`, `Diff`, `FileTree`, `FileCard`
- **Publication:** `PullQuote`, `KeyTakeaway`, `Stat`, `Comparison`,
  `ProductCard`, `RelatedContent`, `SeriesNavigation`, `SponsorBlock`,
  `AudienceBoundary`
- **Media and discovery:** `AppearsOn`, `Audio`, `AuthorCard`, `CallToAction`,
  `Chart`, `Video`

The other nine are interactive (`Tabs`, `CodeBlock`, `CodeGroup`, `Poll`,
`Carousel`, `LinkPreview`, `NewsletterSignup`, `ShareActions`, `SocialPost`).
They render only through `@postkit/chakra` until their behaviour hooks land;
the `chakraOnly` export lists every such component.

## Install

```sh
npm install @postkit/react react react-dom
```

The package is ESM-only, includes TypeScript declarations, and supports
React 19.

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
