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
