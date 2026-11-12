# Installation

Install the Postkit packages your stack needs and check the framework, runtime, and module requirements.

Postkit packages are ESM-only, publish TypeScript declarations, and emit
ES2022 JavaScript. The host application's framework and build tool must support
those package conventions.

## Install a renderer

Postkit has two React renderers. `@postkit/react` holds `createPostkit`, the
[kits](/docs/kits) and the headless views; `@postkit/chakra` adds the Chakra UI
views.

Most sites start with the [Chakra UI renderer](/docs/chakra) and its peer
dependencies:

```sh
npm install @postkit/react @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

For the [headless renderer](/docs/headless), which ships no styles and no
Chakra or Emotion, install `@postkit/react` and [Zag](https://zagjs.com), which
runs its interactive components:

```sh
npm install @postkit/react react react-dom
npm install @zag-js/react @zag-js/core @zag-js/types @zag-js/carousel @zag-js/tabs @zag-js/clipboard
```

The Zag packages are optional peer dependencies of `@postkit/react`, so a
Chakra site uses the copy Chakra already installs and never bundles Zag twice.

`@postkit/chakra` was named `@postkit/react` before 0.3.0. Coming from 0.2,
replace the dependency with `@postkit/chakra` and update your imports; the
component API is unchanged. From 0.3.0, `@postkit/react` is the headless
renderer.

## Add a framework adapter

Framework adapters add native routing around the same component map. Each
takes `@postkit/react` and `@postkit/chakra` as peer dependencies, and npm
installs them with it. Install the one that matches the application:

```sh
# Next.js
npm install @postkit/next @postkit/chakra

# React Router
npm install @postkit/react-router @postkit/chakra react-router

# TanStack Router
npm install @postkit/tanstack-router @postkit/chakra @tanstack/react-router

# Astro
npm install @postkit/astro @postkit/chakra
```

Each framework guide lists the remaining integration steps:
[Next.js](/docs/nextjs), [React Router](/docs/react-router),
[TanStack Router](/docs/tanstack-router), and [Astro](/docs/astro).

## Optional packages

An API, feed processor, or non-React content service can use the core document
contract by itself:

```sh
npm install @postkit/core
```

Add `@postkit/unfurl` to the server or build pipeline when the site renders link
previews:

```sh
npm install @postkit/unfurl
```

Add `@postkit/shiki` when rendered code blocks need syntax highlighting:

```sh
npm install @postkit/shiki
```

Add `@postkit/cli` as a dev dependency for the `postkit` command, which turns
on kits, ejects and scaffolds components, and writes the manifest (see
[CLI](/docs/cli)):

```sh
npm install --save-dev @postkit/cli
```

An HTML email build should use `@postkit/email` (see [Email](/docs/email))
rather than aliasing Chakra UI to an email primitive package. It shares portable Postkit props where the
meaning carries over and deliberately changes the output for interactions that
email clients do not support.

## Requirements

| Integration     | Supported range |
| --------------- | --------------- |
| React           | React 19        |
| Chakra UI       | `>=3.29.0 <4`   |
| Next.js         | `>=15 <17`      |
| React Router    | `>=7 <8`        |
| TanStack Router | `>=1.120 <2`    |
| Astro           | `>=6.4 <8`      |

The package manifests are authoritative for exact peer dependency ranges. Pin
related `@postkit/*` packages to the same release version. See
[Compatibility](/docs/compatibility) for the runtime matrix and hydration notes.
