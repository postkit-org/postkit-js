---
title: Eject
summary: Copy a component's view into your repo to own it, while its contract stays upstream.
category: Customizing
order: 5
since: '0.3.0'
status: draft
---

Ejecting is rung 7 of the customization ladder. It copies a component's view
(and its recipe, for Chakra) into your repo, so you own the source and can
change anything in it.

Unlike copying a component by hand, the contract stays upstream. An ejected
`Figure` still imports `figureDefinition` from `@postkit/core`, so its
directive, validation and manifest entry don't fork, and your posts, Prismark
and the email renderer keep treating it as a Figure.

## Eject a component

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

The CLI copies that renderer's view, plus the recipe for Chakra, and registers
the copy as the component's [view](/docs/views) override in your Postkit
config.

| Flag         | Default       | Meaning                             |
| ------------ | ------------- | ----------------------------------- |
| `--renderer` | from config   | `headless` or `chakra`              |
| `--to`       | `src/postkit` | Where the files go                  |
| `--dry-run`  | `false`       | Show the files without writing them |

{/* TODO(0.3.0): confirm the flag defaults above (taken from the SiteDocsCLI board, not spec 03), how the CLI finds "your config", and the exact output format. */}

## What stays upstream

| Ejected into your repo | Stays in Postkit                                      |
| ---------------------- | ----------------------------------------------------- |
| The view               | The definition: props, directive, anatomy, validation |
| The recipe (Chakra)    | Behaviour, such as carousel paging or code copy       |
|                        | The manifest entry                                    |

Behaviour lives in `@postkit/core/behaviors` and the renderer's hooks, so an
ejected interactive component keeps getting behaviour fixes when you upgrade.

## Keep up with upstream

After an upgrade, `postkit diff` shows what changed upstream in the views you
own, so you can decide what to bring across:

```sh
npx postkit diff figure
```

```text
figure.tsx   0.3.0 → 0.3.2
+ loading={priority ? "eager" : "lazy"}
- loading="lazy"

1 change. Your edits are kept.
```

## Before you eject

Ejecting is the last step before writing your own component. Most changes fit
lower on the ladder, where upgrades land without a diff:

- A different look: [Part styles](/docs/part-styles).
- Different defaults, or one part swapped: [Defaults and slots](/docs/defaults-and-slots).
- A new structure written from scratch: [Views](/docs/views).

See [CLI](/docs/cli) for every command.
