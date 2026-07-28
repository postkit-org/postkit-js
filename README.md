# Postkit

Postkit is a set of portable article components, Markdown tooling, link
metadata resolvers, and framework adapters.

This repository is the standalone home for packages that were originally
developed in the Prismark monorepo.

## Packages

| Package                    | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `@postkit/unfurl`          | Provider-neutral link and social metadata resolution |
| `@postkit/react`           | Chakra-based React components and Markdown tooling   |
| `@postkit/next`            | Next.js MDX and link adapter                         |
| `@postkit/react-router`    | React Router MDX and link adapter                    |
| `@postkit/tanstack-router` | TanStack Router MDX and link adapter                 |
| `@postkit/astro`           | Astro MDX integration and component bridges          |

`@postkit/prismark` remains in the Prismark workspace until
`@prismark/component-protocol@0.1.0` is published from
[`org-prismark/prismark-js`](https://github.com/org-prismark/prismark-js).

## Development

```sh
npm install
npm run build
npm test
npm run lint
npm run typecheck
npm run verify:release
```

The Astro adapter also includes a production fixture:

```sh
npm exec nx run @postkit/astro:build-fixture
```

## Workspace layout

The standalone packages live under `packages/`. Nx infers their build,
typecheck, lint, and Vitest targets from each package's TypeScript and Vite
configuration. Package exports use the `@postkit/source` condition while
developing in the workspace and compiled `dist` entry points when published.

`npm run verify:release` is the local release gate. It formats-checks the
workspace, builds, lints, tests, and typechecks the public-package allowlist,
builds the Astro production fixture, and inspects every npm tarball. The
tarball check also enforces the internal dependency publication order:
`@postkit/unfurl`, `@postkit/react`, and then the framework adapters.
