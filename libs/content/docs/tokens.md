---
title: Tokens
summary: Layer Postkit over a host Chakra system so the site's tokens, fonts, and prose rhythm drive every component.
category: Customizing
order: 1
---

# Tokens

Postkit is host-native by default. Its semantic components use Chakra
primitives internally, so an existing application's tokens and recipes flow
through. Postkit adds no visual preset unless the host opts into one. The
`Prose` wrapper still provides structural content rhythm in either mode.

## Layer a system

```tsx
import { createSystem, defaultConfig } from '@chakra-ui/react';
import { PostkitProvider } from '@postkit/chakra';
import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
} from '@postkit/chakra/theme';

const siteSystem = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body: { value: '"Inter", sans-serif' },
        heading: { value: '"Newsreader", serif' },
        mono: { value: '"JetBrains Mono", monospace' },
      },
    },
  },
});

const system = createPostkitSystem({
  system: siteSystem,
  // Optional. Omit this when the host supplies all visual policy.
  preset: postkitDefaultTheme,
  theme: createPostkitTheme({
    prose: { base: { p: { fontSize: 'lg' } } },
  }),
});

<PostkitProvider system={system}>{article}</PostkitProvider>;
```

The layering order is:

1. The optional `preset`, such as `postkitDefaultTheme`
2. The site-wide Chakra `system`
3. The explicit `theme` supplied to the nearest `PostkitProvider`

`PostkitProvider` accepts the same three props directly, so a site can pass
`system`, `preset`, and `theme` there instead of composing a system first.

Import theme-only APIs from `@postkit/chakra/theme`. This focused entry point
keeps component and Markdown declarations out of shared theme libraries and
reduces cold TypeScript work. Existing imports from `@postkit/chakra` remain
supported.

## Choose a styling mode

- Host-native: pass the site's `system` and omit `preset`. Chakra primitive
  recipes and any host-registered Postkit slot recipes control presentation;
  wrapper-owned prose spacing and semantic technical-content structure remain
  active.
- Standalone preset: pass `preset={postkitDefaultTheme}` for Postkit's complete
  visual treatment, including its dark CodeBlock, CodeGroup, and Terminal
  palettes.
- Scoped customization: add `theme={createPostkitTheme(...)}` to either mode.

## Typography

Postkit components use three font roles: `body` for prose, descriptions, and
controls; `heading` for titles and heading-like slots; and `mono` for code. In
a host system they come from the `fonts` tokens. To change them only inside a
Postkit subtree, pass `typography` to `createPostkitTheme`:

```tsx
const theme = createPostkitTheme({
  typography: {
    body: '"Inter", sans-serif',
    heading: ['"Newsreader"', 'serif'],
    mono: '"JetBrains Mono", monospace',
  },
});
```

## Tune prose rhythm

External spacing belongs to the `Prose` wrapper rather than the individual
Heading, paragraph, table, or code components. Eight custom properties provide
the default flow and internal list scales and can be changed through a scoped
Postkit theme:

```tsx
const documentationTheme = createPostkitTheme({
  prose: {
    base: {
      root: {
        '--postkit-prose-flow-space': 'spacing.5',
        '--postkit-prose-block-space': 'spacing.8',
        '--postkit-prose-section-space': 'spacing.10',
        '--postkit-prose-heading-space': 'spacing.12',
        '--postkit-prose-title-space': 'spacing.16',
        '--postkit-prose-list-indent': 'spacing.8',
        '--postkit-prose-list-item-space': 'spacing.2',
        '--postkit-prose-list-item-indent': 'spacing.1',
      },
    },
  },
});

<PostkitProvider system={siteSystem} theme={documentationTheme}>
  {article}
</PostkitProvider>;
```

The wrapper applies these defaults before its prose recipe and direct `css`
prop, preserving both theme-level and instance-level overrides. Use
`<Prose unstyled>` for a completely bare wrapper.

To restyle individual parts of a component, see [Part styles](/docs/part-styles).
