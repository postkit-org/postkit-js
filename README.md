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
It then installs those tarballs into a fresh temporary consumer and verifies
their runtime and TypeScript entry points without workspace source conditions.

## Publishing

Publishing is performed only by
[`publish.yml`](.github/workflows/publish.yml). The workflow requires the
`npm-production` GitHub environment, verifies that every public package uses
the requested version, requires release tags in the form `v<version>`, and
rejects release commits that are not contained in `main`. Configure the
environment with a required reviewer, prevent self-review and administrator
bypass, and restrict deployments to the `main` branch and tags matching `v*`.

For the first publication, add a short-lived granular npm token with publish
access to the `@postkit` scope as the `NPM_TOKEN` environment secret. After
each package exists on npm, configure its trusted publisher with:

- Provider: GitHub Actions
- Organization: `org-postkit`
- Repository: `postkit-js`
- Workflow: `publish.yml`
- Environment: `npm-production`
- Allowed action: `npm publish`

Then remove `NPM_TOKEN` and revoke the bootstrap token. The workflow uses npm
OIDC publishing and provenance, checks the registry before any mutation, and
can safely resume a partial run only when an already-published tarball has the
same integrity as the local release.
