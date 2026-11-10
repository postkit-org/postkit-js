# Markdown directives

Author Postkit components in plain Markdown with literal-only directives and the Postkit Remark preset.

Plain Markdown pipelines can use literal-only directives:

```md
:::postkit-callout{title="Release status" tone="tip"}
The content remains regular **Markdown**.
:::
```

Directive props are literal values rather than arbitrary JavaScript, which
keeps the format portable and suitable for untrusted authoring environments.

## Enable the Remark preset

Add Postkit's Remark plugins to the Markdown pipeline:

```ts
import { createPostkitRemarkPlugins } from '@postkit/chakra/remark';

export const markdownOptions = {
  remarkPlugins: createPostkitRemarkPlugins(),
};
```

The preset enables GitHub Flavored Markdown, frontmatter recognition, the
directive syntax, and the Postkit transform. Pass options to adjust it:

- `before` and `after` add Remark plugins around Postkit's defaults.
- `gfm: false` or `frontmatter: false` omits that default.
- `postkit: { output: 'hast' }` annotates directives for pipelines such as
  react-markdown that map `data.hName` to a registered component. The default
  output is MDX JSX nodes.

The focused `@postkit/chakra/remark` entry point keeps React components and
Chakra theme declarations out of build-only Markdown tooling. Existing root
imports remain supported.

## Directive forms

Every component has a `postkit-` directive name, listed on its
[component page](/components).

- Components with Markdown children use a container directive with three
  colons, closed by a matching `:::` line.
- Components without children use a leaf directive with two colons on a
  single line.

```md
::postkit-audio{src="/media/episode.mp3" title="Episode 12"}

::postkit-link-preview{href="https://example.com/article"}
```

Props that take a list, such as the `items` of `Tabs` or `Carousel`, take a
JSON array written as a literal string:

```md
::postkit-tabs{items='[{"label":"npm","content":"npm install @postkit/chakra"},{"label":"pnpm","content":"pnpm add @postkit/chakra"}]'}
```

## Validation

Directives are validated against the component declarations while the
Markdown is transformed. By default the transform throws when a directive:

- uses a prop the component does not declare;
- gives an enum prop a value outside its allowed values;
- omits a required prop.

This makes malformed authored content fail a site build instead of silently
changing behavior. Directives whose name is not a Postkit component are left
untouched.

## Choose one syntax per file

MDX interprets braces as JavaScript expressions, which conflicts with the
brace-attribute syntax of directives. Use JSX in `.mdx` files (see
[MDX](/docs/mdx)) and reserve `::postkit-*{...}` declarations for plain
Markdown pipelines.
