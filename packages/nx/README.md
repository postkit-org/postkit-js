# `@postkit/nx`

An Nx plugin with one generator, `component`, that scaffolds a Postkit
component. It writes exactly what `postkit new` writes: the templates come
from `@postkit/cli`.

## Install

```sh
npm install --save-dev @postkit/nx
```

## Generate a component

```sh
nx g @postkit/nx:component device --directory=libs/site/src/postkit --chakra
```

| Option              | Default             | Meaning                                                  |
| ------------------- | ------------------- | -------------------------------------------------------- |
| `name`              |                     | `device`, `CodeSample`…                                  |
| `--directory`       | `src/postkit`       | Where the component folder goes, from the workspace root |
| `--chakra`          | `false`             | Also a Chakra view (`device.chakra.tsx`) and slot recipe |
| `--spec`            | `false`             | A spec per view                                          |
| `--category`        | `article-structure` | The catalog category                                     |
| `--directive`       | `postkit-<name>`    | The Markdown directive                                   |
| `--importExtension` | `none`              | `js` for Node's `nodenext` resolution                    |
| `--layout`          | `site`              | `postkit` writes a built-in into Postkit's own repo      |

Then register it with `createPostkit({ components: [{ definition, view }] })`;
the generator prints the lines.

## In the Postkit repo

The repo uses the generator for built-in components, from source:

```sh
npx nx g @postkit/nx:component device --layout=postkit --chakra --spec
```

That writes the 03 §2.1 folders in `packages/core`, `packages/react` and
`packages/chakra`, and prints the registration steps.

The plugin has no `@nx/devkit` dependency: it uses the tree Nx passes in.
