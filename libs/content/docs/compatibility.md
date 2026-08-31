---
title: Compatibility and environments
summary: Check framework, runtime, rendering, module, and hydration support before integrating PostKit.
category: Reference
order: 86
---

# Compatibility and environments

PostKit packages are ESM-only, publish TypeScript declarations, and emit
ES2022 JavaScript. The host application's framework and build tool must support
those package conventions.

## Framework matrix

| Integration     | Supported range | Rendering notes                                                            |
| --------------- | --------------- | -------------------------------------------------------------------------- |
| React           | React 19        | Chakra-backed components render on the server and client                   |
| Chakra UI       | `^3.36.0`       | The host may provide a `SystemContext`; PostKit layers its recipes over it |
| Shiki           | `^4.3.1`        | Optional lazy highlighting through `@postkit/shiki`                        |
| Next.js         | `>=15 <17`      | Uses the native MDX component map and `next/link`                          |
| React Router    | `>=7 <8`        | The article must render beneath a router provider                          |
| TanStack Router | `>=1.120 <2`    | Portable URLs can be mapped into generated route types                     |
| Astro           | `>=6.4 <8`      | Uses matching React, MDX, and Markdown integrations                        |

The package manifests are authoritative for exact peer dependency ranges.

## Runtime matrix

| Capability                     | Environment                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| Document parsing/serialization | Any ES2022 ESM runtime; React is not required                |
| React rendering                | Server rendering or a browser-capable React application      |
| Static Astro components        | Build/server render with no component hydration              |
| Interactive Astro components   | `client:visible` islands                                     |
| Native audio and video         | Browser-native controls; no PostKit client runtime           |
| Unfurling                      | Server, build process, or trusted editor with Web Fetch APIs |
| Plain Markdown transforms      | Node/build tooling using Unified and Remark                  |
| Shiki syntax highlighting      | Lazy client runtime beneath `PostkitProvider`                |
| Email rendering                | Not defined in the current component contract                |

Carousel, LinkPreview, NewsletterSignup, ShareActions, and SocialPost hydrate as
visible Astro islands. Other current Astro bridges render statically; Audio and
Video retain native browser controls.

## Repository tooling

The repository's CI and release workflow use Node.js 24 and npm. Consumers do
not need Node.js 24 merely to render browser components, but their selected
framework, build tool, and server runtime must satisfy their own requirements
and support PostKit's ES2022 ESM output.

## Stability

PostKit is pre-1.0. Public APIs are typed and clean-consumer tested, but minor
releases may refine the component contract. Pin related `@postkit/*` packages
to the same release version and review the changelog before upgrading.
