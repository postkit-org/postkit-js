---
title: MDX
summary: Author Postkit components as JSX in MDX, and configure the code blocks that fenced Markdown renders.
category: Writing
order: 1
---

Use JSX declarations in MDX:

```mdx
<Callout title="Release status" tone="tip">
  The content remains regular **Markdown**.
</Callout>

<Audio src="/media/episode.mp3" title="Episode 12" />
```

Register Postkit's component map with the framework's MDX runtime. Framework
adapters supply the same components with native internal-link behavior:

```tsx
import { createPostkitMdxComponents } from '@postkit/chakra';

export const mdxComponents = createPostkitMdxComponents();
```

MDX is executable JavaScript. Compile it only from authors trusted at that
level; for untrusted authoring, use [Markdown directives](/docs/markdown-directives)
instead (see [Security](/docs/security)).

## Code blocks

Fenced code blocks are automatically rendered with Postkit's Chakra CodeBlock
component. They have plain-text output, copying, wrapping, and line-number
support without requiring a syntax-highlighting dependency.

By default, non-empty blocks show `"Copy code"`, line numbers are hidden, and
long lines remain unwrapped with horizontal scrolling. Set site-wide behavior
without replacing the Markdown component map:

```tsx
<PostkitProvider
  codeBlock={{
    colorScheme: 'light',
    copy: true,
    lineNumbers: false,
    size: 'md',
    variant: 'outline',
    wrap: false,
  }}
>
  {article}
</PostkitProvider>
```

Direct `CodeBlock` props override provider configuration, and provider
configuration overrides Postkit's neutral defaults. Chakra CodeBlock defaults
the highlighting color scheme to `"dark"` when it is not configured.

Hosts that want syntax highlighting can install `@postkit/shiki`, create its
lazy adapter once at module scope, and pass it to `PostkitProvider`:

```tsx
import { PostkitProvider } from '@postkit/chakra';
import { createPostkitShikiAdapter } from '@postkit/shiki';

const codeBlockAdapter = createPostkitShikiAdapter();

<PostkitProvider codeBlockAdapter={codeBlockAdapter}>
  {article}
</PostkitProvider>;
```

`@postkit/shiki` provides practical language and light/dark theme defaults.
Pass `languages` and `themes` when an application wants a smaller or customized
bundle. Chakra loads the adapter once and reuses it for nested code blocks.

## Customize code-copy feedback

Fenced code blocks inherit copy-control content from `PostkitProvider`. This
keeps site icons and labels outside authored Markdown while retaining Chakra's
Button recipe and clipboard behavior:

```tsx
<PostkitProvider
  codeBlock={{
    copyAriaLabel: 'Copy code',
    copyFeedback: 'tooltip',
    copyIcon: <ClipboardIcon aria-hidden="true" />,
    copyLabel: null,
    copiedIcon: <CheckIcon aria-hidden="true" />,
    copiedLabel: 'Copied!',
  }}
>
  {article}
</PostkitProvider>
```

With `copyFeedback: 'tooltip'`, the control swaps to `copiedIcon` and shows the
copied label in a tooltip without changing the button's width. Chakra's default
check icon is used when `copiedIcon` is omitted. Leave `copyFeedback` unset for
the default inline icon-and-label behavior.

Direct `CodeBlock` props with the same names override these provider defaults.
Use `null` to suppress a provider label or icon for one block. Both feedback
modes announce the copied label through a polite live region.

## Configure individual fences

When the Markdown compiler forwards fence metadata through `meta`,
`metastring`, or `data-meta`, Postkit recognizes safe literal options:

````md
```tsx title="button.tsx" lineNumbers wrap {2-3} maxHeight="24rem"
export function Button() {
  return <button>Save</button>;
}
```
````

Supported options are `title`/`filename`, `lineNumbers`/`noLineNumbers`,
`wrap`/`noWrap`, highlighted ranges such as `{1,3-5}`, and validated
`maxHeight` lengths. Pipeline adapters can instead emit `data-title`,
`data-filename`, `data-line-numbers`, `data-wrap`, `data-highlight-lines`, and
`data-max-height`. Explicit attributes take precedence over the metadata
string. CSS expressions and authored JavaScript are rejected.

## Choose one syntax per file

MDX interprets braces as JavaScript expressions. Use JSX in `.mdx` files and
reserve `::postkit-*{...}` declarations for plain Markdown pipelines (see
[Markdown directives](/docs/markdown-directives)).
