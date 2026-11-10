---
title: CLI
summary: Add, own and create components from your terminal.
category: Reference
order: 4
since: '0.3.0'
status: draft
---

One small tool for the moments config isn't enough: turning on kits, taking a
component into your repo, keeping it current, and making your own.

The CLI is `@postkit/cli`, and its command is `postkit`. It depends only on
`@postkit/core` and file tooling, so it works with either renderer.

```sh
npm install --save-dev @postkit/cli
```

Once it's installed, `npx postkit` runs your project's copy. To try it without
installing, use the package name: `npx @postkit/cli eject figure`. A bare
`npx postkit` outside a project would look for a different, unscoped package.

## Commands

```sh
npx postkit --help
npx postkit eject --help
```

| Command            | What it does                                      | Example                    |
| ------------------ | ------------------------------------------------- | -------------------------- |
| `postkit add`      | Turn on a kit or component and update your config | `npx postkit add media`    |
| `postkit eject`    | Copy a component's view into your repo to own it  | `npx postkit eject figure` |
| `postkit diff`     | See what changed upstream since you ejected       | `npx postkit diff figure`  |
| `postkit new`      | Scaffold a component of your own                  | `npx postkit new showcase`   |
| `postkit manifest` | Write the catalog for editors like Prismark       | `npx postkit manifest`     |

Names work in any case: `figure`, `Figure`, `code-block` and `CodeBlock` all
work.

## Your config

Every command that needs your `createPostkit` config finds it the same way:

1. `--config <file>`, if you pass it.
2. `postkit.config.ts` (or `.mts`, `.js`, `.mjs`) in the current directory,
   then in the project root (the nearest `package.json`). It exports your
   `createPostkit` result as `default` or `postkit`:

   ```ts
   // postkit.config.ts
   export { postkit as default } from './lib/postkit';
   ```

3. Otherwise, the one file in your project that calls `createPostkit(`. If
   there's more than one, the CLI stops and asks for `--config`.

`add` and `eject` edit the file that calls `createPostkit({ … })`, following
`postkit.config.ts` to it. They only change what they can read with
certainty: a single call with an object literal, array literals for `kits`,
`components` and `exclude`, and an object literal for `overrides`. Anything
else, such as kits built in a function or options spread from another
object, is left alone, and the CLI prints the exact lines to add instead.

## postkit add

```sh
npx postkit add media
npx postkit add poll
```

```text
✓ lib/postkit.ts   kits += media
✓ lib/postkit.ts   components += Poll
```

A kit name (`article`, `technical`, `media`, `discovery`, `engagement`,
`publishing`) is imported from `@postkit/react/kits` and added to `kits`. A
built-in component whose kit is already on is taken out of `exclude`;
otherwise its definition and your renderer's view are added to `components`.

| Flag        | Default    | Meaning                               |
| ----------- | ---------- | ------------------------------------- |
| `--config`  | discovered | The config file                       |
| `--dry-run` | `false`    | Print the change as a diff, unwritten |

## postkit eject

Ejecting copies the view (and its recipe, for Chakra) into your repo. The
definition stays upstream, so your posts, validation and editor support don't
fork.

```sh
npx postkit eject figure --renderer chakra --to libs/postkit
```

```text
✓ libs/postkit/figure/figure.recipe.ts
✓ libs/postkit/figure/figure.tsx
✓ .postkit-eject.json   Figure @ @postkit/chakra 0.3.0
✓ lib/postkit.ts   overrides.Figure.view → ../libs/postkit/figure/figure

Still bound to Figure's definition from @postkit/core/components.
Run `postkit diff figure` after upgrading @postkit/chakra.
```

| Flag            | Default       | Meaning                               |
| --------------- | ------------- | ------------------------------------- |
| `--renderer`    | from config   | `headless` or `chakra`                |
| `--to`          | `src/postkit` | Where the component's folder goes     |
| `--dry-run`     | `false`       | Show the files and config change only |
| `--force`       | `false`       | Overwrite files that already exist    |
| `--no-register` | registers     | Leave your config alone               |

"From config" means `chakra` when your config passes `renderer: chakra` from
`@postkit/chakra`, and `headless` when it has no renderer. See
[Eject](/docs/eject) for when to use it.

## postkit diff

After an upgrade, see exactly what upstream changed in the views you own, and
decide what to bring across.

```sh
npx postkit diff figure
```

```text
Figure (chakra) in libs/postkit/figure: @postkit/chakra 0.3.0 → 0.3.2
--- a/figure.tsx	@postkit/chakra@0.3.0
+++ b/figure.tsx	@postkit/chakra@0.3.2
@@ -54,7 +54,7 @@
-          loading={props.loading}
+          loading={props.priority ? 'eager' : props.loading}

1 file changed upstream. Your copy wasn't changed.
Your edits: figure.recipe.ts.
```

Without a name, it checks every component in `.postkit-eject.json`.

| Flag          | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| `--accept`    | Record the installed version as your new base, once you're done |
| `--exit-code` | Exit with 1 when upstream changed, for CI                       |

## postkit new

Scaffold a component with its definition, headless view and styles. It gets a
Markdown directive, validation and a manifest entry for free.

```sh
npx postkit new showcase
```

```text
✓ src/postkit/showcase/showcase.definition.ts
✓ src/postkit/showcase/showcase.tsx
✓ src/postkit/showcase/showcase.css

Register it with createPostkit({ components }) in lib/postkit.ts:
…
Use it as <Showcase /> in MDX or :::postkit-showcase in Markdown.
```

| Flag                 | Default             | Meaning                                      |
| -------------------- | ------------------- | -------------------------------------------- |
| `--to`               | `src/postkit`       | Where the component's folder goes            |
| `--chakra`           | `false`             | Also a Chakra view and slot recipe           |
| `--spec`             | `false`             | A spec per view (Vitest)                     |
| `--category`         | `article-structure` | The catalog category                         |
| `--directive`        | `postkit-<name>`    | The Markdown directive                       |
| `--description`      |                     | The one line editors and the catalog show    |
| `--import-extension` | `none`              | `js` for Node's `nodenext` module resolution |

In an Nx workspace, `nx g @postkit/nx:component showcase` writes the same files
from the same templates. See [New components](/docs/new-components).

## postkit manifest

```sh
npx postkit manifest --out public/postkit-manifest.json
```

Loads your config (TypeScript and TSX work) and writes the v2 manifest of
exactly the components it enables, yours included, to stdout or `--out`. It's
the same JSON as `postkit.manifest()`, for editors like Prismark.
