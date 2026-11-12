# Part styles

Restyle the named parts of Postkit components with scoped slot recipes, per-instance slot styles, or the host's Chakra recipes.

Every Postkit component is built from named parts (slots). A `Callout` has
`root`, `icon`, `content`, `title`, and `body`; a `CodeBlock` has a title,
language label, copy control, and code lines. Each part can be styled at three
levels: the host's Chakra recipes, a scoped Postkit theme, or a single
instance.

## Host recipes flow through

Postkit's semantic components compose Chakra primitives, so the host's
Heading, Link, Button, Input, Table, Tabs, Code, and related recipes apply
without extra configuration.

Markdown headings render through Chakra `Heading` with `as="h1"` through
`as="h6"`. Postkit does not override the Heading recipe's font weight, family,
line height, letter spacing, or color. Markdown blockquotes and semantic lists,
including lists inside publishing components, render through Chakra
`Blockquote` and `List`. Code-block copy actions similarly render through
Chakra `Button` while retaining Postkit's copy behavior.

Structured controls also retain their Chakra recipe boundaries:
`NewsletterSignup` composes `Field`, `PullQuote` composes `Blockquote`, `Stat`
composes `Stat`, poll result bars compose `Progress`, and product ratings
compose a read-only `RatingGroup`.

Card-like surfaces use Chakra `Card` roots and parts where their content model
matches, author imagery uses `Avatar`, callouts and takeaways use `Alert`, and
responsive video or embed frames use `AspectRatio`. Postkit retains semantic
`article` and `aside` roots through Chakra's polymorphic rendering. Carousels
delegate paging, pointer dragging, and accessible controls to Chakra
`Carousel`, so the host's Carousel recipe flows through while Postkit retains
its article item model and content slots. Instructional `Steps` compose Chakra
`List`, allowing the host List recipe to flow through beneath Postkit's numbered
marker treatment. `Disclosure` intentionally remains native `details` and
`summary`, preserving built-in toggle behavior without client-side JavaScript.

## Scoped slot recipes

`createPostkitTheme` builds component-scoped slot recipe overrides for the
`theme` prop on `PostkitProvider`. Each component key accepts `base`,
`variants`, `defaultVariants`, and `compoundVariants`, keyed by slot name:

```tsx
import { PostkitProvider } from '@postkit/chakra';
import { createPostkitTheme } from '@postkit/chakra/theme';

const theme = createPostkitTheme({
  callout: {
    base: {
      title: { fontWeight: 'semibold', letterSpacing: '-0.01em' },
    },
    variants: {
      tone: {
        tip: { root: { borderInlineStartWidth: '4px' } },
      },
    },
  },
});

<PostkitProvider system={siteSystem} theme={theme}>
  {article}
</PostkitProvider>;
```

The override applies only beneath that provider, so a documentation or
editorial subtree can differ from the rest of the site without changing
site-wide component defaults. To register Postkit slot recipes in the host
system itself, use the recipe names in `postkitRecipeKeys` (for example
`postkitRecipeKeys.callout` is `postkitCallout`).

## One instance

Components accept `slotStyles` for per-instance part styles, `rootProps` for
the root element, and `unstyled` to drop the component's recipe entirely:

```tsx
<Callout
  title="Heads up"
  tone="warning"
  slotStyles={{ title: { textTransform: 'uppercase' } }}
/>
```

Use content props for semantic variation and theme recipes for persistent
visual policy. Repeating `slotStyles` across articles is a sign the style
belongs in a theme.

## CodeBlock parts

CodeBlock's canonical content-specific slots are `title`, `language`,
`control`, `copyTrigger`, `copyIndicator`, `content`, `code`, `codeText`,
`line`, and `lineNumber`. The older `filename`, `actions`, `button`, `scroller`,
and `lineContent` slot names remain compatibility aliases.

## Lists

Markdown `ul`, `ol`, and `li` elements render through Chakra's List recipe;
pass `unstyled` to a mapped list root when its complete list subtree should be
bare. Ordered-list mappings retain native `start`, `reversed`, and `type`
attributes supplied by Markdown renderers.
