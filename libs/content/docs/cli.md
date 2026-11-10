---
title: CLI
summary: Add, own and create components from your terminal.
category: Reference
order: 4
since: '0.3.0'
status: draft
---

# CLI

One small tool for the moments config isn't enough: turning on kits, taking a
component into your repo, keeping it current, and making your own.

The CLI is `@postkit/cli`, and its command is `postkit`. It depends only on
`@postkit/core` and file tooling, so it works with either renderer.

```sh
npm install --save-dev @postkit/cli
```

{/* TODO(0.3.0): confirm the install story. `npx postkit` without a local install would resolve the unscoped "postkit" package, not @postkit/cli. */}

## Commands

```sh
npx postkit --help
```

| Command            | What it does                                      | Example                    |
| ------------------ | ------------------------------------------------- | -------------------------- |
| `postkit add`      | Turn on a kit or component and update your config | `npx postkit add media`    |
| `postkit eject`    | Copy a component's view into your repo to own it  | `npx postkit eject figure` |
| `postkit diff`     | See what changed upstream since you ejected       | `npx postkit diff figure`  |
| `postkit new`      | Scaffold a component of your own                  | `npx postkit new device`   |
| `postkit manifest` | Write the catalog for editors like Prismark       | `npx postkit manifest`     |

{/* TODO(0.3.0): confirm `add` and `manifest` options (which config file `add` edits; where `manifest` writes). */}

## postkit eject

Ejecting copies the view (and its recipe, for Chakra) into your repo. The
definition stays upstream, so your posts, validation and editor support don't
fork.

```sh
npx postkit eject figure --renderer chakra --to libs/postkit
```

```text
✓ libs/postkit/figure/figure.tsx
✓ libs/postkit/figure/figure.recipe.ts
✓ lib/postkit.ts   overrides.Figure.view → ./figure

Still bound to figureDefinition from @postkit/core.
Run `postkit diff figure` after upgrading.
```

| Flag         | Default       | Meaning                             |
| ------------ | ------------- | ----------------------------------- |
| `--renderer` | from config   | `headless` or `chakra`              |
| `--to`       | `src/postkit` | Where the files go                  |
| `--dry-run`  | `false`       | Show the files without writing them |

See [Eject](/docs/eject) for when to use it.

## postkit diff

After an upgrade, see exactly what upstream changed in the views you own, and
decide what to bring across.

```sh
npx postkit diff figure
```

```text
figure.tsx   0.3.0 → 0.3.2
+ loading={priority ? "eager" : "lazy"}
- loading="lazy"

1 change. Your edits are kept.
```

## postkit new

Scaffold a component with its definition, headless view, styles and tests. It
gets a Markdown directive, validation and a manifest entry for free.

```sh
npx postkit new device
```

```text
✓ device/device.definition.ts
✓ device/device.tsx
✓ device/device.css
✓ device/device.behavior.spec.ts

Use it as <Device /> or :::postkit-device in Markdown.
```

In an Nx workspace, `nx g @postkit/nx:component device` does the same with
your generators' conventions. See [New components](/docs/new-components).

{/* TODO(0.3.0): the eject and new flag defaults and outputs above are from the SiteDocsCLI board; spec 03 only gives `npx postkit eject figure --renderer chakra --to libs/postkit` and `npx postkit new device`. Confirm against @postkit/cli. */}
