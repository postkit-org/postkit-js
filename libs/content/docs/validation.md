---
title: Validation
summary: Find out what Postkit checks when a post compiles, what the errors say, and how to fix them.
category: Writing
order: 3
status: published
---

Postkit checks authored components when a post compiles, so a misspelled prop,
an impossible value or a misspelled component stops the build instead of
reaching a reader. This page describes what is checked and what each error
means.

## What gets checked

Directives, and the component names used in MDX, are validated by Postkit's
Remark plugin. It is part of the preset from `createPostkitRemarkPlugins()`,
which also enables GFM, frontmatter and the directive syntax:

```ts
import { createPostkitRemarkPlugins } from '@postkit/chakra/remark';

export const remarkPlugins = createPostkitRemarkPlugins();
```

The same preset is exported from `@postkit/react/remark`. With
[`createPostkit`](/docs/create-postkit), use `postkit.remarkPlugins`, which
validates against exactly the components your [kits](/docs/kits) enable.

Each directive is matched to a component by its directive name, such as
`postkit-callout`, or by the component name in lowercase, such as `callout`.
Its attributes are then checked against that component's declared props:

| Check                      | Example                                | Error                                                            |
| -------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| The prop exists            | `:::postkit-callout{mood="tip"}`       | `Unknown Callout prop "mood" in Postkit directive.`              |
| An enum value is allowed   | `:::postkit-callout{tone="tpi"}`       | `Invalid Callout tone value "tpi".`                              |
| JSON data is literal JSON  | `::postkit-tabs{items="[{label: 1}]"}` | `Invalid Tabs items value: expected literal JSON…`               |
| A number is a number       | `initialIndex="second"`                | `Invalid Tabs initialIndex value "second": …`                    |
| Required props are present | `::postkit-card-grid` with no `items`  | `Postkit CardGrid directive requires "items".`                   |
| The component is enabled   | `::postkit-poll` without its kit       | `Unknown Postkit directive "postkit-poll": Poll isn't enabled.…` |

Attribute values are literal strings. Directives never evaluate JavaScript, so
they're safe for untrusted authoring environments. A prop that takes data, such
as `items`, takes JSON: a JavaScript object literal fails the JSON check, and
in MDX a brace expression in directive attributes is rejected by the MDX parser
itself. Each component page lists its props, their allowed values and which
ones are required.

## Strict mode

Strict mode is on by default. It fails the build on anything Postkit doesn't
recognise: an unknown prop, an unknown `postkit-*` directive, an unknown MDX
component, or a built-in component your `createPostkit` set doesn't enable.
Turning it off reports those as warnings instead:

```ts
export const remarkPlugins = createPostkitRemarkPlugins({
  postkit: { strict: false },
});
```

With strict mode off, unknown props are dropped, and unknown directives and
components render as they did before. Invalid values, malformed JSON and
missing required props fail in both modes, and so does a
[footnote](#footnotes) reference with no note. Warnings are `VFileMessage`s on the
compiled file's `messages`; they don't stop the build, so check them if you
rely on them.

Keep strict mode on for anything you publish. A dropped prop or an ignored
component is a silent change to what the author asked for.

## Aliases and warnings

Some props accept another name. Callout's `tone` also answers to `type`, so
callouts written for other tools work as they are: `:::postkit-callout{type="tip"}`
is the same as `tone="tip"`. The alias is checked like the prop, and when both
are set the prop wins and the build reports a warning.

Some props are recommended rather than required. Leaving one out is a warning,
never an error, in every mode, strict included. Today that's `Video`'s
`captions`: a video without a captions track warns, in the build output and in
the browser console during development, unless you mark it `decorative` (a
silent loop, say) or pass `tracks`:

```text
Postkit Video: the "captions" prop is missing. Add a captions track (a WebVTT file), or mark the video decorative. (content/post.md:7:1-7:48)
```

These warnings carry the `ruleId` `recommended-prop`. In MDX, the check reads
the element's literal attributes, so `<Video src="/a.mp4" decorative />`
doesn't warn, and an element with a spread (`{...props}`) is left alone.

## Where an error points

Errors are reported through the file being compiled (`vfile.fail`), so MDX,
next-mdx-remote, content-collections and other unified hosts report them as
compile errors. Each message ends with the file and the
`line:column-line:column` range of the directive or component:

```text
Invalid Callout tone value "tpi". (content/post.md:3:1-5:4)
```

The error also carries `file`, `line`, `column`, `ruleId` (such as
`unknown-directive`, `invalid-prop`, `missing-prop`, `unknown-component` or
`missing-footnote`) and
`source: 'postkit'`. The file appears when your build passes a path to the
compiler, for example `compile({ path, value })`. When it passes the source as
a plain string, as next-mdx-remote's `serialize` does, the message carries the
line and column alone and your build tool names the page it was compiling.

## Unknown components

**In plain Markdown**, a directive with the `postkit-` prefix that doesn't
match a component, such as `:::postkit-calout`, fails a strict build:

```text
Unknown Postkit directive "postkit-calout". Check the name against the component catalog. (content/post.md:3:1-5:4)
```

A directive without the prefix that isn't a component is put back as the text
you wrote. That keeps a ratio like 4.5:1, a time like 10:30, `localhost:3000`
or `:smile_cat:` as text, instead of turning them into an empty block. If you
use other directive plugins, add them to the preset's `before` list: a
directive they've already handled (it carries `data.hName`) is left alone.

**In MDX**, a capitalised JSX element that isn't a Postkit component fails a
strict build:

```text
Unknown MDX component <Calout>: it isn't a Postkit component, imported by the document or listed in `components`. (content/post.mdx:3:1-3:33)
```

A built-in component your `createPostkit` set leaves out fails the same way,
and the error says so:

```text
Unknown MDX component <Poll>: Postkit's Poll isn't enabled. Add its kit to createPostkit, or remove it from `exclude`. (content/post.mdx:1:1-1:22)
```

Lowercase HTML elements, member expressions such as `<motion.div>`, and names
the document imports or exports are always accepted. If your site passes its
own components to MDX through the component map, list them:

```ts
export const remarkPlugins = createPostkitRemarkPlugins({
  postkit: { components: ['Showcase', 'SiteBanner'] },
});
```

## Props in MDX

The Remark plugin checks MDX component names, not their props (apart from the
recommended-prop warnings above). Props on JSX elements are passed to the
component as written, so an unknown prop or an out-of-range value on
`<Callout>` isn't caught at compile time.

The components check them when they render instead. In development, every
built-in view warns once in the browser console about a missing required prop
or a value of the wrong kind, and so does any view you build with
`postkitView` or `postkitChakraView`:

```text
Postkit Callout: the "tone" prop must be one of "note", "tip", "important", "warning", "caution"; received "tpi".
```

An enum value the component doesn't allow falls back to its default, so the
page still renders. Nothing is checked or logged in production. A few
components that take JSON data, such as `LinkPreview` and `SocialPost`, reject
malformed data when they render.

## Footnotes

Footnotes are checked when the post compiles (see [Footnotes](/docs/footnotes)):

| Check                              | Result  | Message                                                                  |
| ---------------------------------- | ------- | ------------------------------------------------------------------------ |
| A reference has a note             | Error   | `Footnote [^b] has no definition.`                                       |
| Every note is referenced           | Warning | `Footnote [^z] is defined but never referenced; it is left out.`         |
| A note is defined once             | Warning | `Footnote [^a] is defined more than once; the first definition is used.` |
| The list is placed once            | Warning | `Footnotes is placed more than once; the first placement is used.`       |
| `::footnotes` settings are allowed | Error   | `Invalid Footnotes placement value "middle".`                            |

The error fails the build in every mode, strict or not, and points at the
reference. The warnings carry the `ruleId` `unreferenced-footnote`,
`duplicate-footnote` or `duplicate-footnotes`.

## One syntax per file

MDX reads braces as JavaScript expressions. Use JSX in `.mdx` files and keep
`:::postkit-*` directives with their brace attributes for plain Markdown
pipelines. See [Troubleshooting](/docs/troubleshooting) for other integration
problems.
