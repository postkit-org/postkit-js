# Releasing Postkit

Postkit packages are published only by
`.github/workflows/publish.yml`. The workflow validates all public packages as a
single versioned release and publishes them in dependency order.

## Before creating a release

1. Update every public package to the intended version.
2. Add a changelog entry under `apps/site/content/changelog/`.
3. Run `npm run verify:release`.
4. Run `npm run site:check`.
5. Merge the release commit into `main`.
6. Create a tag in the form `v<version>` from that commit.

The release gate checks formatting, builds, lint, tests, typechecking, the Astro
production fixture, npm tarball contents, dependency order, and runtime and
TypeScript imports from a clean consumer.

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

1. `@postkit/unfurl`
2. `@postkit/react`
3. Framework adapters

Before mutating the registry, the workflow checks each requested package and
version. A partially completed publication can be rerun when every package
already on npm has the same integrity as the local release tarball.

For a manual, reviewed workflow dispatch, provide the exact version already
committed to `main` and the required confirmation value. Do not publish package
workspaces directly from a development machine.
