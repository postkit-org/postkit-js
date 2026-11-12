# definePostkitComponent

Define a component's contract once, and derive its types, directive, theming and manifest entry from it.

`definePostkitComponent` creates a component definition: the framework-free
contract for its props, its named parts and how it validates. Postkit's own
components and yours are defined the same way. It lives in
`@postkit/core/components`, so manifest tooling and editors can read
definitions without React.

```ts
// callout.definition.ts
import {
  definePostkitComponent,
  prop,
  presentation,
} from '@postkit/core/components';

export const calloutDefinition = definePostkitComponent({
  name: 'Callout',
  directive: 'postkit-callout',
  category: 'article-structure',
  description: 'A highlighted note, tip, warning, or caution.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('An optional heading.'),
    tone: prop.enum(['note', 'tip', 'important', 'warning', 'caution'], {
      description: 'The semantic emphasis.',
      default: 'note',
      themeVariant: true,
      aliases: ['type'],
    }),
  },
  slots: ['root', 'icon', 'content', 'title', 'body'],
  keywords: ['note', 'admonition', 'alert'],
  example: {
    props: { tone: 'tip', title: 'Keep the content' },
    children: 'Change the renderer without changing the article.',
  },
});
```

## Fields

| Field         | Description                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | The PascalCase component name, used in MDX (`<Callout>`) and as the key in `defaults` and `overrides`.                                                            |
| `directive`   | The kebab-case Markdown directive name, such as `postkit-callout`.                                                                                                |
| `category`    | `article-structure`, `technical-content`, `media`, `discovery`, `engagement` or `publishing`. It groups the component in the manifest and in editors.             |
| `description` | A one-line description for the catalog and editors.                                                                                                               |
| `children`    | `'mdx'` when the component wraps authored content, or `'none'` (the default).                                                                                     |
| `runtime`     | `static` (the default), `native-controls`, `client` or `resolver`. `client` and `resolver` components hydrate in Astro.                                           |
| `stability`   | `initial` (the default), `experimental`, `stable` or `deprecated`. Editors can hide experimental components.                                                      |
| `props`       | The props, built with `presentation` and the `prop` builders.                                                                                                     |
| `slots`       | The anatomy: the named parts every renderer must emit. It must include `root`.                                                                                    |
| `keywords`    | Optional search terms for the catalog and editors.                                                                                                                |
| `example`     | Optional example props, and children for an `mdx` component, for the catalog and generated docs.                                                                  |
| `email`       | `{ fallback }`, where `fallback` is `'link'`, `'text'` or `'omit'`: what the email renderer does when it has no view for the component. See [Email](/docs/email). |

`definePostkitComponent` checks the definition when it runs and throws a
`TypeError` naming the component for anything it can't use: a name that isn't
PascalCase, a directive that isn't kebab-case, an unknown category, a missing
`root` slot, a prop not built with the builders, or example props the
definition doesn't declare. It returns the definition frozen, with the
defaults filled in and `themeVariants` listing the props marked as theme
variants.

## Props

`presentation` spreads in the shared `size` (`sm`, `md` or `lg`, default
`md`) and `variant` (`outline`, `subtle` or `plain`, default `subtle`) props.
The `prop` builders declare the rest:

| Builder                                  | Example                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `prop.string(description, options?)`     | `prop.string('An optional heading.')`                                              |
| `prop.number(description, options?)`     | `prop.number('The start time, in seconds.', { default: 0 })`                       |
| `prop.boolean(description, options?)`    | `prop.boolean('Whether it starts open.', { default: false })`                      |
| `prop.enum(values, options)`             | `prop.enum(['note', 'tip'], { description, default: 'note', themeVariant: true })` |
| `prop.json<Type>(description, options?)` | `prop.json<Item[]>('The items, as a JSON array.', { required: true })`             |

A directive writes every value as a string: numbers and booleans are checked
and converted, a bare boolean attribute (`{open}`) means `true`, and a `json`
prop takes literal JSON, checked for syntax only. `prop.enum` takes its
description in the options, or a string in place of the options.

Options, for every builder:

- `required`: `true` makes the prop required. A directive without it fails
  validation, and views receive it as non-optional.
- `default`: the value when the author doesn't set one. It appears in the
  manifest and the props table, and views receive the prop as non-optional.
  An enum default must be one of its values.
- `aliases`: other names authors may use, such as Callout's `type` for
  `tone`. Directives, MDX props and the static serializer map an alias to
  the prop, and the prop wins when both are set (see
  [Validation](/docs/validation#aliases-and-warnings)).
- `recommended`: `{ reason, unless? }` for a prop authors should set. Leaving
  it out is a warning, never an error, in every mode. `unless` lists props
  that make it unnecessary, such as Video's `decorative`. A required prop
  can't also be recommended.

`prop.enum` and `prop.boolean` also take `themeVariant`: `true` makes the
prop a recipe variant automatically, and a site-wide default for it goes into
the recipe's `defaultVariants`.

## What it derives

From one definition, TypeScript derives the rest with no code generation:

| Derived                     | For Callout                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| Prop types for views        | `PostkitPropsOf<typeof calloutDefinition>`                                  |
| Prop types for authors      | `PostkitAuthoredPropsOf<typeof calloutDefinition>`                          |
| Slot union                  | `PostkitSlotOf<typeof calloutDefinition>`                                   |
| Variant union               | `PostkitThemeVariantOf<typeof calloutDefinition>`                           |
| Recipe key                  | `PostkitRecipeKeyOf<typeof calloutDefinition>`, which is `'postkitCallout'` |
| MDX map entry and directive | Registered when the component is enabled                                    |

`PostkitPropsOf` is what a view receives, so a prop with a `default` is never
optional. `PostkitAuthoredPropsOf` is what an author writes, where only
`required` props are required. All of these types come from
`@postkit/core/components`.

What TypeScript can't express is generated or computed from the definitions:
the [manifest](/docs/manifest) JSON, the Astro wrappers and the renderer
support matrix.

## Views

A view reads the definition. `postkitView` (headless) and `postkitChakraView`
(Chakra, with a recipe) give the render function typed `props` and a
`part(name)` helper that applies each part's attributes, class names and
styles, and both swap in slot overrides:

```tsx
import { postkitCalloutMarks, postkitView } from '@postkit/react';

export const Callout = postkitView(calloutDefinition, ({ props, part }) => (
  <aside {...part('root')}>
    <span {...part('icon')} aria-hidden="true">
      {postkitCalloutMarks[props.tone]}
    </span>
    <div {...part('content')}>
      {props.title && <p {...part('title')}>{props.title}</p>}
      <div {...part('body')}>{props.children}</div>
    </div>
  </aside>
));
```

See [Views](/docs/views) for writing one, and
[New components](/docs/new-components) for scaffolding a definition and view
together.
