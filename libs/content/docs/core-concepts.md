---
title: Core concepts
summary: Understand the content contract, renderers, host responsibilities, and resolver boundaries.
category: Concepts
order: 30
---

# Core concepts

PostKit separates authored meaning from application infrastructure.

## The content contract

Components such as `Callout`, `Figure`, `Audio`, and `LinkPreview` describe
article intent. Their declarations define names, directive syntax, accepted
props, and whether they contain Markdown children.

The versioned `@postkit/core` document preserves semantic elements, rich
component names, literal props, and children independently of any renderer.
It can be parsed from or serialized to HTML, Markdown, safe literal MDX, and
JSON. The component contract can also be authored as JSX in trusted MDX or as
literal-only directives in plain Markdown.

## The renderer

Each environment maps the portable declaration to a real component. React's
`DocumentRenderer` maps semantic nodes and declarations to Chakra-backed
components. Astro bridges the same declarations into Astro components and
hydrates only the interactive parts.

## The host application

The application owns:

- Page layout and navigation
- Routing policy
- Chakra tokens and site theme
- Media storage and URL generation
- Secrets and remote provider credentials
- Caching and persistence

PostKit provides explicit extension points for these responsibilities instead
of assuming one deployment architecture.

## Resolver boundaries

Remote content is normalized before rendering. `@postkit/unfurl` returns a
provider-neutral snapshot; `LinkPreview` and `SocialPost` render that snapshot.
This keeps remote requests, credentials, and provider-specific response formats
out of presentation components.
