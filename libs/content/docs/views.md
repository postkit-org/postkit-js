---
title: Views
summary: Replace a component's whole render with your own view, bound to the same definition.
category: Customizing
order: 4
since: '0.3.0'
status: draft
---

A view is the render function for a component. Replacing it is rung 6 of the
customization ladder: you change the whole markup, and the component keeps its
definition. Its props, directive, validation and manifest entry stay the same,
so posts and Prismark don't notice the swap.

Reach for a view when [defaults and slots](/docs/defaults-and-slots) aren't
enough, for example when the parts need a different structure, not just a
different look.

## Build a view

Build the view with `postkitView` and the component's definition. The
definition gives your render function typed props and a `part` helper:

```tsx
// lib/postkit/figure.tsx
import { figureDefinition } from '@postkit/core/components';
import { postkitView } from '@postkit/react';

export const CommuneFigure = postkitView(
  figureDefinition,
  ({ props, part }) => (
    <figure {...part('root')}>
      <img {...part('image')} src={props.src} alt={props.alt} />
      {props.caption && (
        <figcaption {...part('figcaption')}>
          <span {...part('caption')}>{props.caption}</span>
        </figcaption>
      )}
    </figure>
  ),
);
```

{/* TODO(0.3.0): confirm postkitView is exported from the @postkit/react root, and check the Figure part names against the 0.3.0 figureDefinition anatomy (today's slots are root, mediaLink, media, image, figcaption, caption, credit, creditLink). */}

`part(name)` returns everything a part needs: its anatomy attributes, its
`classNames` entry, any [slot override](/docs/defaults-and-slots), and, with
Chakra, the recipe's class and styles. `postkitView` also applies `unstyled`,
merges `slotStyles` and `rootProps`, validates props in development and applies
your site's defaults and overrides, so your view doesn't repeat that work.

## Use it

Register the view as an override:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, media } from '@postkit/react/kits';

import { CommuneFigure } from './postkit/figure';

export const postkit = createPostkit({
  kits: [article, media],
  overrides: {
    Figure: { view: CommuneFigure },
  },
});
```

## Chakra views

With the Chakra renderer, build the view with `postkitChakraView`, which also
takes the component's recipe. Parts then get the recipe's slot styles and your
system's tokens:

```tsx
export const Callout = postkitChakraView(
  calloutDefinition,
  calloutRecipe,
  ({ props, part }) => (
    <Alert.Root as="aside" status={toneStatus[props.tone]} {...part('root')}>
      <Alert.Indicator {...part('icon')}>
        {props.icon ?? marks[props.tone]}
      </Alert.Indicator>
      <Alert.Content {...part('content')}>
        {props.title && (
          <Alert.Title {...part('title')}>{props.title}</Alert.Title>
        )}
        <Box {...part('body')}>{props.children}</Box>
      </Alert.Content>
    </Alert.Root>
  ),
);
```

This is how Postkit's own Chakra Callout is written.

{/* TODO(0.3.0): confirm where postkitChakraView and the built-in recipes (calloutRecipe) are exported from, and add the imports to this sample. */}

## Keep the anatomy

Emit every part in the definition's anatomy, with `part(name)`. The part names
are what [part styles](/docs/part-styles), slot overrides and other renderers
rely on, so a view that drops one loses the styles and overrides aimed at it.

## Views or eject

A view starts from nothing. If you want to start from Postkit's own view and
change it, [eject](/docs/eject) it instead: you get the source in your repo,
already wired up as an override.
