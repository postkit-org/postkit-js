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
adds no visual preset unless the host opts into one.

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
  recipes and any host-registered PostKit slot recipes control presentation.
- Standalone preset: pass `preset={postkitDefaultTheme}` for PostKit's complete
  visual treatment.
- Scoped customization: add `theme={createPostkitTheme(...)}` to either mode.

Markdown headings render through Chakra `Heading` with `as="h1"` through
`as="h6"`. PostKit's preset supplies content spacing but does not override the
Heading recipe's font weight, family, line height, letter spacing, or color.
