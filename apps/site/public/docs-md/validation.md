# Validation

Find out what Postkit checks when a post compiles, what the errors say, and how to fix them.

Postkit checks authored components when a post compiles, so a misspelled prop
or an impossible value stops the build instead of reaching a reader. This page
describes what is checked today and what each error means.

## What gets checked

Plain Markdown directives are validated by Postkit's Remark plugin. It is part
of the preset from `createPostkitRemarkPlugins()`, which also enables GFM,
frontmatter and the directive syntax:

```ts
import { createPostkitRemarkPlugins } from '@postkit/chakra/remark';

export const remarkPlugins = createPostkitRemarkPlugins();
```

Each directive is matched to a component by its directive name, such as
`postkit-callout`, or by the component name in lowercase, such as `callout`.
Its attributes are then checked against that component's declared props:

| Check                      | Example                               | Error                                               |
| -------------------------- | ------------------------------------- | --------------------------------------------------- |
| The prop exists            | `:::postkit-callout{mood="tip"}`      | `Unknown Callout prop "mood" in Postkit directive.` |
| An enum value is allowed   | `:::postkit-callout{tone="tpi"}`      | `Invalid Callout tone value "tpi".`                 |
| Required props are present | `::postkit-card-grid` with no `items` | `Postkit CardGrid directive requires "items".`      |

Attribute values are literal strings. Directives never evaluate JavaScript, so
they're safe for untrusted authoring environments. Each component page lists
its props, their allowed values and which ones are required.

## Strict mode

Strict mode is on by default. Turning it off only relaxes the unknown-prop
check: unknown props are dropped instead of failing the build. Invalid enum
values and missing required props still fail.

```ts
export const remarkPlugins = createPostkitRemarkPlugins({
  postkit: { strict: false },
});
```

Keep strict mode on for anything you publish. A dropped prop is a silent
change to what the author asked for.

## Where an error points

Directive errors name the component and the prop, but they don't carry a line
number yet. Your build tool tells you which file it was compiling when the
error was thrown, for example the page Next.js was prerendering.


## Unknown components

A misspelled component behaves differently in each syntax today.

**In MDX**, a JSX element that isn't in your component map fails when the page
renders. The error comes from MDX itself:

```text
Expected component `Calout` to be defined: you likely forgot to import, pass, or provide it.
It’s referenced in your code at `3:1-3:31` in `content/post.mdx`
```

The second line, with the line, column and file, appears when MDX compiles in
development mode.

**In plain Markdown**, a directive whose name doesn't match a component is not
an error. `:::postkit-calout` is left as a generic directive and renders as a
plain block, so the content shows up without the component. If a directive
seems to be ignored, check its name against the component page and make sure
Postkit's Remark plugins are enabled.


## Props in MDX

The Remark plugin validates directives only. Props on JSX elements in MDX are
passed to the component as written, so an unknown prop or an out-of-range value
on `<Callout>` isn't caught at compile time. A few components that take JSON
data, such as `LinkPreview` and `SocialPost`, reject malformed data when they
render.


## One syntax per file

MDX reads braces as JavaScript expressions. Use JSX in `.mdx` files and keep
`:::postkit-*` directives with their brace attributes for plain Markdown
pipelines. See [Troubleshooting](/docs/troubleshooting) for other integration
problems.
