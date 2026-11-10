---
title: Defaults and slots
summary: Change what authors get without asking, and swap a single part of a component for your own.
category: Customizing
order: 3
since: '0.3.0'
status: draft
---

Defaults and slots are rungs 4 and 5 of the customization ladder. Both keep the
component's definition, so its directive, validation and manifest entry don't
change and every existing post keeps working.

| Rung            | What you change                    | How                                                    |
| --------------- | ---------------------------------- | ------------------------------------------------------ |
| 1. Props        | One instance                       | `variant`, `size`, `tone`, `layout`…                   |
| 2. Tokens       | Fonts, colours, spacing everywhere | Your Chakra system, or `--postkit-*` custom properties |
| 3. Part styles  | A component's look                 | Recipes, CSS on the anatomy, or `classNames` per part  |
| **4. Defaults** | What authors get without asking    | `defaults` in `createPostkit`                          |
| **5. Slots**    | One part of the markup             | `overrides.Callout.slots`                              |
| 6. Views        | The whole render                   | `overrides.Figure.view`                                |
| 7. Eject        | The source itself                  | `npx postkit eject`                                    |
| 8. New          | Something Postkit doesn't have     | `npx postkit new`                                      |

## Defaults

Set site-wide prop defaults with `defaults`, keyed by component name:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article } from '@postkit/react/kits';

export const postkit = createPostkit({
  kits: [article],
  defaults: {
    Callout: { variant: 'plain' },
  },
});
```

Every callout now renders with the plain variant unless its author asks for
another one. A prop written in the post always wins over a default.

Without `defaults`, every component uses its definition's defaults. The
`variant` default is `subtle` for every component.

The [manifest](/docs/manifest)'s per-prop `default` is the definition's
default, not your site's: the manifest describes the components, and your
defaults are a rendering choice.

### How each renderer applies them

The same `defaults` object works with both renderers:

- **Headless:** the defaults become the view's prop defaults.
- **Chakra:** props that are theme variants (`variant`, `size`, `tone`) are
  written into the recipe's `defaultVariants`. Other props become the view's
  defaults.

If you set the same variant default in both places, `createPostkit`'s
`defaults` wins.

Because Chakra variant defaults live in the recipe, you can also set them with
[part styles](/docs/part-styles), next to the rest of a component's look:

```ts
import { createPostkitTheme } from '@postkit/chakra';

export const postkitTheme = createPostkitTheme({
  callout: {
    defaultVariants: { variant: 'plain' },
  },
});
```

Use `defaults` when the choice is about content, and the recipe when it's part
of a theme you share between sites.

## Slots

A slot override replaces one named part of a component and keeps the rest.
The part names are the component's anatomy, listed on each component page.

```tsx
// lib/postkit.tsx
import { createPostkit, type PostkitSlotProps } from '@postkit/react';
import { article } from '@postkit/react/kits';

function InkMark(props: PostkitSlotProps) {
  return (
    <span {...props}>
      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
      </svg>
    </span>
  );
}

export const postkit = createPostkit({
  kits: [article],
  overrides: {
    Callout: {
      slots: { icon: InkMark },
    },
  },
});
```

Your part receives the slot's props and styles, typed as `PostkitSlotProps`:
the anatomy attributes (`data-postkit-part` and any state), the part's
`className` and `style`, and its children. With Chakra, the recipe's styles
for that part arrive in `className` too. Spread them onto your root element
so the part still carries its name and still picks up your CSS.

Slots replace the parts a view renders itself. A view not built with
`postkitView` or `postkitChakraView` (in 0.3.0, Chakra's `CodeBlock`,
`CodeGroup`, `LinkPreview` and `SocialPost`) can't take slot overrides yet,
and `createPostkit` says so; override its view instead.

## When to go further

If you need to change how the parts fit together, not just one of them,
replace the whole render with a [view](/docs/views). If you need to change the
source itself, [eject](/docs/eject) it.
