# New components

Scaffold a component of your own that gets a directive, validation and a manifest entry for free.

When Postkit doesn't have what you need, define it yourself. This is rung 8 of
the customization ladder. Your component is defined the same way Postkit's
built-in ones are, so it gets a Markdown directive, validation, theming and a
manifest entry for free, and Prismark can offer it to writers.

## Scaffold it

```sh
npx postkit new showcase --category media
```

```text
✓ src/postkit/showcase/showcase.definition.ts
✓ src/postkit/showcase/showcase.tsx
✓ src/postkit/showcase/showcase.css

Register it with createPostkit({ components }) in lib/postkit.ts:

import { Showcase } from '../src/postkit/showcase/showcase';
import { showcaseDefinition } from '../src/postkit/showcase/showcase.definition';

export const postkit = createPostkit({
  // …your renderer and kits
  components: [{ definition: showcaseDefinition, view: Showcase }],
});

Use it as <Showcase /> in MDX or :::postkit-showcase in Markdown.
Import showcase.css from your global stylesheet for the headless view.
```

You get a definition, a headless view and its styles, as a starting point
that wraps authored content (`children: 'mdx'`), with a `title` prop and
`root`, `title` and `body` parts. `--chakra` adds a
Chakra view (`showcase.chakra.tsx`) and slot recipe (`showcase.recipe.ts`), and
`--spec` adds a spec per view. The CSS targets the anatomy attributes; import
it from your global stylesheet. See [CLI](/docs/cli#postkit-new) for every
flag.

In an Nx workspace, the generator writes the same files from the same
templates:

```sh
nx g @postkit/nx:component showcase --category=media --directory=libs/site/src/postkit
```

## Define it

The definition is the contract: the component's name, directive, props and
named parts. It's framework-free, so the manifest and editors can read it
without React. See [definePostkitComponent](/docs/define-postkit-component) for
every field.

The example frames a screenshot in a browser or app window. (Postkit's own
[Device](/components/device) already does iPhone, iPad and Mac frames.)

```ts
// showcase/showcase.definition.ts
import {
  definePostkitComponent,
  prop,
  presentation,
} from '@postkit/core/components';

export const showcaseDefinition = definePostkitComponent({
  name: 'Showcase',
  directive: 'postkit-showcase',
  category: 'media',
  description: 'A screenshot framed in a browser or app window.',
  runtime: 'static',
  stability: 'experimental',
  props: {
    ...presentation,
    kind: prop.enum(['browser', 'window'], {
      description: 'The showcase frame.',
      default: 'browser',
      themeVariant: true,
    }),
    src: prop.string('The screenshot URL.', { required: true }),
    alt: prop.string('Text alternative for the screenshot.', {
      required: true,
    }),
    caption: prop.string('An optional caption.'),
  },
  slots: ['root', 'frame', 'screen', 'caption'],
  keywords: ['showcase', 'screenshot', 'mockup'],
  example: {
    props: { kind: 'browser', src: '/shots/home.png', alt: 'The home page' },
  },
});
```

- **Required props** take `{ required: true }`. A directive without them
  fails validation, an MDX element without them gets a console warning in
  development, and the view receives them as non-optional.
- **`children`** can be left out, as here: it defaults to `'none'`. Set
  `children: 'mdx'` when the component wraps authored content.
- **`category`** is one of Postkit's six: `article-structure`,
  `technical-content`, `media`, `discovery`, `engagement` or `publishing`.
  Pick the closest; it groups the component in the manifest and in editors.

## Write the view

Build the view with `postkitView`, so it emits the anatomy and picks up
defaults, slot overrides and part styles like any other component:

```tsx
// showcase/showcase.tsx
import { postkitView } from '@postkit/react';

import { showcaseDefinition } from './showcase.definition';

export const Showcase = postkitView(showcaseDefinition, ({ props, part }) => (
  <figure {...part('root')}>
    <div {...part('frame')}>
      <img {...part('screen')} src={props.src} alt={props.alt} />
    </div>
    {props.caption && (
      <figcaption {...part('caption')}>{props.caption}</figcaption>
    )}
  </figure>
));
```

## Register it

Add the definition and view to `components`, next to your kits:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, media } from '@postkit/react/kits';

import { Showcase } from './showcase/showcase';
import { showcaseDefinition } from './showcase/showcase.definition';

export const postkit = createPostkit({
  kits: [article, media],
  components: [{ definition: showcaseDefinition, view: Showcase }],
});
```

Writers can now use it in either syntax:

```mdx
<Showcase
  kind="window"
  src="/shots/editor.png"
  alt="The editor with a post open"
/>
```

```md
::postkit-showcase{kind="window" src="/shots/editor.png" alt="The editor with a post open"}
```

## What you get

From the one definition:

- Typed props for your view, with `PostkitPropsOf<typeof showcaseDefinition>`.
- A directive, validated like Postkit's own (see [Validation](/docs/validation)).
- An entry in `postkit.manifest()`, so editors like Prismark can offer it.
- Slot and variant types derived from its parts and theme-variant props, and
  the recipe key `postkitShowcase` if you write a Chakra view and recipe for it
  with `postkitChakraView`.
- Anatomy attributes on every part, so [part styles](/docs/part-styles) work
  the same as for built-in components.

## Share it

A component package exports `{ definition, view }` pairs and a manifest,
written with `createPostkitComponentManifest` from `@postkit/core/components`
(see [Manifest](/docs/manifest)). A site turns the components on by adding
those pairs to `components`, and editors read the manifest. A component that
proves itself can be proposed upstream to Postkit.
