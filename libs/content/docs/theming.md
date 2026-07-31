---
title: Theming
summary: Layer PostKit recipes over a Chakra system while preserving the host application's design tokens.
category: Integration
order: 60
---

# Theming

PostKit components use Chakra UI tokens and slot recipes. The default system is
usable immediately, while an existing application can retain its own tokens,
conditions, utilities, and global styles.

```tsx
import { createSystem, defaultConfig } from '@chakra-ui/react';
import {
  createPostkitSystem,
  createPostkitTheme,
  PostkitProvider,
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

const system = createPostkitSystem(
  siteSystem,
  createPostkitTheme({
    prose: { base: { p: { fontSize: 'lg' } } },
  }),
);

<PostkitProvider system={system}>{article}</PostkitProvider>;
```

The layering order is:

1. PostKit defaults
2. The site-wide Chakra system
3. The theme supplied to the nearest `PostkitProvider`

Use content props for semantic variation and theme recipes for persistent visual
policy.
