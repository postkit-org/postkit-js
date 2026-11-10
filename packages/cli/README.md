# `@postkit/cli`

The `postkit` command: turn on kits and components, take a component's view
into your repo and keep it current, scaffold components of your own, and
write the manifest editors read. It depends only on `@postkit/core` and file
tooling, and works with either renderer.

## Install

```sh
npm install --save-dev @postkit/cli
npx postkit --help
```

`npx postkit` runs the local install. For a one-off run without installing,
use the scoped name: `npx @postkit/cli eject figure`. (A bare `npx postkit`
outside a project would look for an unscoped `postkit` package.)

## Commands

| Command                   | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| `postkit add <kit\|name>` | Adds a kit to `kits`, or a built-in component to `components`        |
| `postkit eject <name>`    | Copies a view (and its Chakra recipe) into your repo, bound upstream |
| `postkit diff [name]`     | Prints a unified diff of what upstream changed since you ejected     |
| `postkit new <name>`      | Scaffolds a definition, headless view and CSS (`--chakra`, `--spec`) |
| `postkit manifest`        | Writes the v2 manifest of your configured set (`--out <file>`)       |

```sh
npx postkit add media
npx postkit eject figure --renderer chakra --to libs/postkit
npx postkit diff figure
npx postkit new device --chakra
npx postkit manifest --out public/postkit-manifest.json
```

## Finding your config

1. `--config <file>`;
2. `postkit.config.{ts,mts,js,mjs}` in the working directory, then in the
   project root (the nearest `package.json`). It exports your
   `createPostkit` result, as `default` or `postkit`, for example
   `export { postkit as default } from './lib/postkit';`;
3. otherwise, the one file in the project that calls `createPostkit(`. If
   there's more than one, the CLI asks for `--config`.

`add` and `eject` edit the file that calls `createPostkit({ … })`, following a
config file's re-export. They only edit what they can read with certainty:
one call with an object literal, array literals for `kits`, `components` and
`exclude`, and an object literal for `overrides`. Otherwise they change
nothing and print the lines to add. `manifest` loads the config (TypeScript
and TSX through jiti) and calls its `manifest()`.

## Eject and diff

Each renderer package ships its view sources in `dist/eject/`, built with the
package. `eject` copies a component's files from the installed package and
rewrites their imports: the definition comes from `@postkit/core/components`,
helpers from the package's public API, and internal modules a view needs are
copied to `internal/`. It records the package, version, a content hash and
the upstream content in `.postkit-eject.json` at the project root.

`diff` compares that recorded upstream content with the installed version's
and prints a unified diff. Your copy is never changed; `--accept` moves the
base to the installed version once you've brought across what you want.

See [Eject](https://postkit.org/docs/eject) and
[New components](https://postkit.org/docs/new-components).

## API

The package also exports the commands (`runPostkitCli`, `postkitEject`, …)
and the scaffold templates (`postkitComponentScaffold`), which
`@postkit/nx` uses.
