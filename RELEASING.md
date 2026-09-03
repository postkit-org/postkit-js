# Releasing Postkit

Postkit packages are published only by
`.github/workflows/publish.yml`. The workflow validates all public packages as a
single versioned release and publishes them in dependency order.

## Before creating a release

1. Update every public package to the intended version.
2. Add a changelog entry under `libs/content/changelog/`.
3. Run `npm run verify:release`.
4. Merge the release commit into `main`.
5. Create a tag in the form `v<version>` from that commit.

The release gate checks formatting, builds, lint, tests, coverage, typechecking,
the documentation site, the Astro production fixture, npm tarball contents,
dependency order, and runtime and TypeScript imports from a clean consumer.

## GitHub environment

Publishing requires the `npm-production` GitHub environment. Configure it with:

- A required reviewer
- Self-review and administrator bypass disabled
- Deployments restricted to `main` and tags matching `v*`

Each npm package should use a trusted publisher configured as:

- Provider: GitHub Actions
- Organization: `postkit-org`
- Repository: `postkit-js`
- Workflow: `publish.yml`
- Environment: `npm-production`
- Allowed action: `npm publish`

The workflow uses npm OIDC publishing and provenance. A bootstrap
`NPM_TOKEN` is only needed for a package's first publication; remove and revoke
it after trusted publishing is configured.

## Publication order and recovery

Packages are published in dependency order:

1. `@postkit/core`
2. `@postkit/unfurl`
3. `@postkit/react`
4. `@postkit/email` and `@postkit/shiki`
5. Framework adapters

Before mutating the registry, the workflow checks each requested package and
version. A partially completed publication can be rerun when every package
already on npm has the same integrity as the local release tarball.

## Local yalc consumers

`npm run yalc:publish` rebuilds every public package and writes it to the local
yalc store. `npm run yalc:push` additionally refreshes registered consumers.
Before pushing a package, the helper resolves its complete internal Postkit
dependency and peer closure and links any missing packages into that consumer
with `--no-pure`. This keeps newly introduced internal packages available
without converting them to peer dependencies or requiring every consumer to
track the Postkit package graph manually.

For a manual, reviewed workflow dispatch, provide the exact version already
committed to `main` and the required confirmation value. Do not publish package
workspaces directly from a development machine.
