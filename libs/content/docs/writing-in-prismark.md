---
title: Writing in Prismark
summary: Insert and edit Postkit components in Prismark without touching syntax.
category: Writing
order: 7
status: draft
---

{/* TODO(review): Ryan to confirm every Prismark claim on this page before it is published. Sources are 03 D6, D10, §3.1, §3.2, §7 and §7.1. */}

Prismark is an editor that writes the same Markdown your site builds. Writers
insert and edit Postkit components there without typing directive syntax, and
the file they save is the file your site renders.

## The same components

Prismark reads your site's [manifest](/docs/manifest), so writers see the
components your site has turned on, with their props and allowed values. The
manifest comes from the same `createPostkit` call your site uses, or from
`npx postkit manifest` (see [CLI](/docs/cli)).

Components marked `experimental` in the manifest can be hidden in Prismark
until they're reviewed.

## The same preview

From 0.3.0, Prismark previews components with the headless renderer,
`@postkit/react` with `styles.css`, bundled in its signed build. Prismark's own
renderers are retired, so each component has one rendering in the editor and
one on your site, both from the same definition.

## Callouts

Prismark vaults use Postkit's `Callout`, with `tone` as the canonical prop.
From 0.3.0, directives also accept `type` as an alias for `tone`, so callouts
written either way keep working. Prismark's Standard Callout is retired.

```md
:::postkit-callout{tone="tip" title="Keep the content"}
Change the renderer without changing the article.
:::
```

## Footnotes

Footnotes are portable from 0.3.0. In Prismark their marks show as chips, notes
are edited in place and renumber as you write, and they render in your site's
house style from the same footnote config.

## Your own components

Components you define, and third-party component packages, export a
definition, a view and a manifest. That is what Prismark's per-workspace
component packages setting reads, so your own components appear in the editor
next to Postkit's. See [New components](/docs/new-components).
