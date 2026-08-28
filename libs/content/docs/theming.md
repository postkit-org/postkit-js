---
title: Theming
summary: Layer PostKit recipes over a Chakra system while preserving the host application's design tokens.
category: Integration
order: 60
---

# Theming

PostKit is host-native by default. Its semantic components use Chakra
primitives internally, allowing an existing application's Heading, Link,
Button, Input, Table, Tabs, Code, and related recipes to flow through. PostKit
adds no visual preset unless the host opts into one. The `Prose` wrapper still
provides structural content rhythm in either mode.

```tsx
import { createSystem, defaultConfig } from '@chakra-ui/react';
import {
  createPostkitSystem,
  createPostkitTheme,
  PostkitProvider,
  postkitDefaultTheme,
} from '@postkit/react';

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

Use content props for semantic variation and theme recipes for persistent visual
policy. `createPostkitTheme` remains the final, component-scoped override for a
documentation or editorial subtree.

## Choose a styling mode

- Host-native: pass the site's `system` and omit `preset`. Chakra primitive
  recipes and any host-registered PostKit slot recipes control presentation;
  wrapper-owned prose spacing and semantic technical-content structure remain
  active.
- Standalone preset: pass `preset={postkitDefaultTheme}` for PostKit's complete
  visual treatment, including its dark CodeBlock, CodeGroup, and Terminal
  palettes.
- Scoped customization: add `theme={createPostkitTheme(...)}` to either mode.

Markdown headings render through Chakra `Heading` with `as="h1"` through
`as="h6"`. PostKit does not override the Heading recipe's font weight, family,
line height, letter spacing, or color. Code-block copy actions similarly render
through Chakra `Button` while retaining PostKit's copy behavior.

CodeBlock's canonical content-specific slots are `title`, `language`,
`control`, `copyTrigger`, `copyIndicator`, `content`, `code`, `codeText`,
`line`, and `lineNumber`. The older `filename`, `actions`, `button`, `scroller`,
and `lineContent` slot names remain compatibility aliases.

## Tune prose rhythm

External spacing belongs to the `Prose` wrapper rather than the individual
Heading, paragraph, table, or code components. Five custom properties provide
the default flow scale and can be changed through a scoped PostKit theme:

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
