---
title: Components
summary: Learn how Postkit components, declarations, props, and presentation variants work together.
category: Authoring
order: 40
---

# Components

Postkit includes article structure, technical content, media, discovery,
sharing, and conversion components.

Common components include:

- `Callout`, `Aside`, `KeyTakeaway`, and `PullQuote`
- `CodeBlock`, `CodeGroup`, `Diff`, `FileTree`, and `Terminal`
- `Audio`, `Video`, `Figure`, `Gallery`, and `Carousel`
- `LinkPreview`, `RelatedContent`, and `SeriesNavigation`
- `ShareActions`, `SocialPost`, and `AppearsOn`
- `AuthorCard`, `NewsletterSignup`, and `CallToAction`

## Presentation props

Portable components share compact presentation controls:

- `size`: `sm`, `md`, or `lg`
- `variant`: `outline`, `subtle`, or `plain`

Site-wide visual decisions belong in the Chakra system or Postkit theme rather
than repeated content props.

## Declarations

The declaration manifest is the machine-readable content contract. It describes
each component, its plain-Markdown directive, child mode, and prop schema.
Editors and other authoring tools can use this manifest without importing the
React renderer.

The public component explorer is generated from that same declaration source,
so it stays aligned with the renderer and editor integrations.

[Browse live previews, variants, sizes, syntax, and props →](/components)
