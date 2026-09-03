# Contributing to Postkit

Postkit is an npm workspace managed with Nx. Public libraries live in
`packages/`, the documentation and changelog site lives in `apps/site`, and
release tooling lives in `tools/`.

## Prerequisites

- Node.js 24
- npm

Install dependencies and run the public-package checks:

```sh
npm install
npm run check
npm run site:check
```

Prefer Nx targets when working on one package:

```sh
npm exec nx test @postkit/react
npm exec nx lint @postkit/unfurl
npm exec nx build @postkit/astro
```

The executable framework and service examples have a combined validation
target:

```sh
npm run examples:check
```

## Making a change

1. Identify the smallest public package that owns the behavior.
2. Add or update focused tests beside the implementation.
3. Update the package README when installation, behavior, or public API changes.
4. Update the component declaration when a portable component or prop changes.
5. Run the affected Nx targets.
6. Run `npm run verify:release` before requesting a release.

Applications own routing policy, credentials, asset storage, and outer layout.
Keep those concerns behind Postkit's resolver and adapter boundaries instead of
adding application-specific behavior to the portable component contract.

## Local package testing with yalc

Build and publish every public package to the local yalc store:

```sh
npm run yalc:publish
```

In a consuming project, add only the packages being exercised. To install the
complete set:

```sh
npx yalc add \
  @postkit/core \
  @postkit/unfurl \
  @postkit/react \
  @postkit/email \
  @postkit/shiki \
  @postkit/next \
  @postkit/react-router \
  @postkit/tanstack-router \
  @postkit/astro
npm install
```

After making changes, rebuild and propagate them to consumers:

```sh
npm run yalc:push
```

Both root commands pass additional arguments to yalc:

```sh
npm run yalc:publish -- --store-folder /tmp/postkit-yalc
```

When testing is complete, run `npx yalc remove --all` followed by `npm install`
in the consumer. Keep temporary `.yalc/` directories and `yalc.lock` files out
of version control.

## Workspace behavior

Nx infers build, typecheck, lint, and Vitest targets from each package's
TypeScript and Vite configuration. Package exports use the `@postkit/source`
condition inside the workspace and compiled `dist` entry points when published.

`npm run verify:release` formats the workspace, builds, lints, tests, and
typechecks every public package, builds the Astro fixture, inspects npm
tarballs, and installs them into a clean temporary consumer.

## Reporting issues

Open an issue with a minimal reproduction, the package and version involved,
the framework/runtime versions, and whether the behavior occurs during build,
server rendering, hydration, or client interaction.
