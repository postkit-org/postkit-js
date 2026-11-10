# Introduction

What Postkit is, how its content contract, renderers and host application fit together, and which package to start with.

Postkit is a portable publishing toolkit. It gives articles a shared component
vocabulary (callouts, figures, code blocks, link previews and more) and keeps
that vocabulary separate from the application that renders it. Write the
content once, then render it with Chakra UI, in an email, in Astro, or through
any framework adapter.

Postkit separates authored meaning from application infrastructure.

## The content contract

Components such as `Callout`, `Figure`, `Audio`, and `LinkPreview` describe
article intent. Their declarations define names, directive syntax, accepted
props, and whether they contain Markdown children.

The versioned `@postkit/core` document preserves semantic elements, rich
component names, literal props, and children independently of any renderer.
It can be parsed from or serialized to HTML, Markdown, safe literal MDX, and
JSON. The component contract can also be authored as JSX in trusted MDX or as
literal-only directives in plain Markdown.

The declaration manifest is the machine-readable form of that contract. It
describes each component, its plain-Markdown directive, child mode, and prop
schema, so editors and other authoring tools can use it without importing the
React renderer. The [component catalog](/components) is generated from the
same source.

## The renderer

Each environment maps the portable declaration to a real component. React's
`DocumentRenderer` maps semantic nodes and declarations to Chakra-backed
components. Astro bridges the same declarations into Astro components and
hydrates only the interactive parts. `@postkit/email` shares the portable
props where their meaning carries over and uses explicit fallbacks for
interactions that email clients do not support.

## The host application

The application owns:

- Page layout and navigation
- Routing policy
- Chakra tokens and site theme
- Media storage and URL generation
- Secrets and remote provider credentials
- Caching and persistence

Postkit provides explicit extension points for these responsibilities instead
of assuming one deployment architecture. Adapters do not configure the
application's content loader, authentication, asset storage, secrets,
deployment platform, or outer page layout.

## Choosing a package

Install the package closest to the application boundary. Framework adapters
use the Chakra-based React component system and add their native routing
behavior.

| Package                    | Choose it for                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `@postkit/core`            | Versioned HTML, Markdown, MDX, and JSON interchange without a React dependency        |
| `@postkit/chakra`          | React components, Chakra theming, Markdown directives, or a framework-neutral MDX map |
| `@postkit/email`           | Chakra Email rendering with explicit email-safe component fallbacks                   |
| `@postkit/shiki`           | Lazy Shiki syntax highlighting for Postkit and Chakra code blocks                     |
| `@postkit/next`            | Next.js MDX and `next/link`                                                           |
| `@postkit/react-router`    | React Router and router-native internal links                                         |
| `@postkit/tanstack-router` | TanStack Router and application-defined typed route resolution                        |
| `@postkit/astro`           | Astro Markdown/MDX and selective React hydration                                      |
| `@postkit/unfurl`          | Server-side or build-time URL metadata normalization                                  |

Continue with [Installation](/docs/installation) for the install command that
matches your stack, or go straight to the [Quick start](/docs/quick-start).
