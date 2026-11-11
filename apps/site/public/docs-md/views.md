# Views

Replace a component's whole render with your own view, bound to the same definition.

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

`part(name)` returns everything a part needs: its anatomy attributes
(`data-postkit-component` and the theme-variant state on the root,
`data-postkit-part` on every part), its `classNames` entry, its `slotStyles`
and, on the root, `rootProps`. With Chakra it also returns the recipe's class
and styles. The part names are typed from the definition, so a misspelled part
doesn't compile.

`postkitView` also does the work every view needs. It applies `unstyled`,
fills in your site's defaults and then the definition's, so a prop with a
default is never `undefined`, maps aliases such as Callout's `type` to their
prop, and swaps in any [slot overrides](/docs/defaults-and-slots). In
development it warns once in the console about a missing required prop or a
value of the wrong kind.

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
// lib/postkit/callout.tsx
import { Alert, Box } from '@chakra-ui/react';
import { postkitCalloutRecipe, postkitChakraView } from '@postkit/chakra';
import { calloutDefinition } from '@postkit/core/components';
import { postkitCalloutMarks } from '@postkit/react';

const toneStatus = {
  note: 'info',
  tip: 'success',
  important: 'neutral',
  warning: 'warning',
  caution: 'error',
} as const;

export const InkCallout = postkitChakraView(
  calloutDefinition,
  postkitCalloutRecipe,
  ({ props, part }) => (
    <Alert.Root as="aside" status={toneStatus[props.tone]} {...part('root')}>
      <Alert.Indicator aria-hidden="true" {...part('icon')}>
        {postkitCalloutMarks[props.tone]}
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

Postkit's own Chakra Callout is written the same way. `@postkit/chakra`
exports each built-in recipe as `postkit<Name>Recipe`, such as
`postkitCalloutRecipe`, with its part names as `postkit<Name>Slots`.

The view uses the recipe your Chakra system registers under the recipe key
(`postkitCallout`) when there is one, so `createPostkitTheme` overrides still
apply. Without one, the parts keep the recipe's class names and render
unstyled; pass `{ fallback: 'recipe' }` as a fourth argument to apply the
recipe you passed instead, or `{ recipeKey }` to read another key.

## Keep the anatomy

Emit each part you render with `part(name)`, under the definition's name for
it. The part names are what [part styles](/docs/part-styles), slot overrides
and other renderers rely on, so a part your view drops or renders without
`part()` loses the styles and overrides aimed at it. The Figure view above,
for example, leaves out the credit, link and figure-number parts, so styles
for those have nothing to apply to.

## Views or eject

A view starts from nothing. If you want to start from Postkit's own view and
change it, [eject](/docs/eject) it instead: you get the source in your repo,
already wired up as an override.
