---
title: Markdown and MDX
summary: Author PostKit declarations in MDX or literal-only plain Markdown directives.
category: Authoring
order: 50
---

# Markdown and MDX

Use JSX declarations in MDX:

```mdx
<Callout title="Release status" tone="tip">
  The content remains regular **Markdown**.
</Callout>

<Audio src="/media/episode.mp3" title="Episode 12" />
```

Register PostKit's component map with the framework's MDX runtime. Framework
adapters supply the same components with native internal-link behavior.

## Code blocks

Fenced code blocks are automatically rendered with PostKit's Chakra CodeBlock
component. They have plain-text output, copying, wrapping, and line-number
support without requiring a syntax-highlighting dependency.

Hosts that want syntax highlighting can install Shiki, create Chakra's Shiki
adapter, and pass it to `PostkitProvider`:

```tsx
import { createShikiAdapter } from '@chakra-ui/react';
import { PostkitProvider } from '@postkit/react';
import type { Highlighter } from 'shiki';

const codeBlockAdapter = createShikiAdapter<Highlighter>({
  async load() {
    const { createHighlighter } = await import('shiki');
    return createHighlighter({
      langs: ['bash', 'json', 'markdown', 'tsx', 'typescript'],
      themes: ['github-dark', 'github-light'],
    });
  },
  theme: {
    dark: 'github-dark',
    light: 'github-light',
  },
});

<PostkitProvider codeBlockAdapter={codeBlockAdapter}>
  {article}
</PostkitProvider>;
```

The host chooses the language and theme bundle, so PostKit does not make every
consumer download Shiki. Chakra loads the adapter once and reuses it for nested
code blocks.

## Plain Markdown directives

Plain Markdown pipelines can use literal-only directives:

```md
:::postkit-callout{title="Release status" tone="tip"}
The content remains regular **Markdown**.
:::
```

Enable PostKit's Remark preset in the Markdown pipeline. Directive props are
literal values rather than arbitrary JavaScript, which keeps the format
portable and suitable for untrusted authoring environments.

## Choose one syntax per file

MDX interprets braces as JavaScript expressions. Use JSX in `.mdx` files and
reserve `::postkit-*{...}` declarations for plain Markdown pipelines.
