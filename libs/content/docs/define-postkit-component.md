---
title: definePostkitComponent
summary: Define a component's contract once, and derive its types, directive, theming and manifest entry from it.
category: Reference
order: 2
since: '0.3.0'
status: draft
---

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
| `name`        | The component name, used in MDX (`<Callout>`) and as the key in `defaults` and `overrides`.                                                                       |
| `directive`   | The Markdown directive name, such as `postkit-callout`.                                                                                                           |
| `category`    | The category, such as `article-structure`.                                                                                                                        |
| `description` | A one-line description for the catalog and editors.                                                                                                               |
| `children`    | `'mdx'` when the component wraps authored content.                                                                                                                |
| `runtime`     | `static`, `native-controls`, `client` or `resolver`.                                                                                                              |
| `stability`   | `initial`, `experimental`, `stable` or `deprecated`. Editors can hide experimental components.                                                                    |
| `props`       | The props, built with `presentation` and the `prop` builders.                                                                                                     |
| `slots`       | The anatomy: the named parts every renderer must emit.                                                                                                            |
| `keywords`    | Search terms for the catalog and editors.                                                                                                                         |
| `example`     | Example props and children for the catalog and generated docs.                                                                                                    |
| `email`       | `{ fallback }`, where `fallback` is `'link'`, `'text'` or `'omit'`: what the email renderer does when it has no view for the component. See [Email](/docs/email). |

{/* TODO(0.3.0): confirm the other `children` value (today's declarations use childMode 'none'), and the list of categories. */}

## Props

`presentation` spreads in the shared `size` and `variant` props. The `prop`
builders declare the rest:

| Builder                      | Example                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `prop.string(description)`   | `prop.string('An optional heading.')`                                              |
| `prop.enum(values, options)` | `prop.enum(['note', 'tip'], { description, default: 'note', themeVariant: true })` |

Enum options:

- `description`: what the prop does.
- `default`: the value when the author doesn't set one. It appears in the
  manifest and the props table.
- `themeVariant`: `true` makes the prop a recipe variant automatically, and a
  site-wide default for it goes into the recipe's `defaultVariants`.

{/* TODO(0.3.0): document the builders for the other prop kinds (today's declarations also have boolean, number and json) and how to mark a prop required. Spec 03 §2.2 only shows prop.string and prop.enum. */}

## What it derives

From one definition, TypeScript derives the rest with no code generation:

| Derived                     | For Callout                                |
| --------------------------- | ------------------------------------------ |
| Prop types for views        | `PostkitPropsOf<typeof calloutDefinition>` |
| Slot union                  | `PostkitThemeSlotMap['callout']`           |
| Variant union               | `PostkitThemeVariantMap['callout']`        |
| Recipe key                  | `postkitCallout`                           |
| MDX map entry and directive | Registered when the component is enabled   |

What TypeScript can't express is generated: the [manifest](/docs/manifest)
JSON, Astro wrappers, the renderer support matrix and docs stubs.

## Views

A view reads the definition. `postkitView` (headless) and `postkitChakraView`
(Chakra, with a recipe) give the render function typed `props` and a
`part(name)` helper that applies each part's attributes, class names, slot
overrides and styles:

```tsx
export const Callout = postkitView(calloutDefinition, ({ props, part }) => (
  <aside {...part('root')}>
    <span {...part('icon')} aria-hidden="true">
      {props.icon ?? marks[props.tone]}
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
