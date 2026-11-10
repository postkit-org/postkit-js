---
title: Installation
summary: Install the Postkit packages your stack needs and check the framework, runtime, and module requirements.
category: Get started
order: 2
---

Postkit packages are ESM-only, publish TypeScript declarations, and emit
ES2022 JavaScript. The host application's framework and build tool must support
those package conventions.

## Install the React renderer

Most sites start with the Chakra UI renderer and its peer dependencies:

```sh
npm install @postkit/chakra @chakra-ui/react @emotion/react react react-dom
```

`@postkit/chakra` is the Chakra UI renderer, previously named `@postkit/react`.
The `@postkit/react` name is reserved for a future generic React renderer without
a Chakra dependency. The current framework adapters use `@postkit/chakra`.

## Add a framework adapter

Framework adapters add native routing around the same component map. Install
the one that matches the application:

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

An HTML email build should use `@postkit/email` rather than aliasing Chakra UI
to an email primitive package. It shares portable Postkit props where the
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
