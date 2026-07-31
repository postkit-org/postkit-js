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

Hosts that want syntax highlighting can install `@postkit/shiki`, create its
lazy adapter once at module scope, and pass it to `PostkitProvider`:

```tsx
import { PostkitProvider } from '@postkit/react';
import { createPostkitShikiAdapter } from '@postkit/shiki';

const codeBlockAdapter = createPostkitShikiAdapter();

<PostkitProvider codeBlockAdapter={codeBlockAdapter}>
  {article}
</PostkitProvider>;
```

`@postkit/shiki` provides practical language and light/dark theme defaults.
Pass `languages` and `themes` when an application wants a smaller or customized
bundle. Chakra loads the adapter once and reuses it for nested code blocks.

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
