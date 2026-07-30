---
title: Components
summary: Learn how PostKit components, declarations, props, and presentation variants work together.
category: Authoring
order: 40
---

# Components

PostKit includes article structure, technical content, media, discovery,
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

Site-wide visual decisions belong in the Chakra system or PostKit theme rather
than repeated content props.

## Declarations

The declaration manifest is the machine-readable content contract. It describes
each component, its plain-Markdown directive, child mode, and prop schema.
Editors and other authoring tools can use this manifest without importing the
React renderer.

The generated catalog will expand this page with searchable examples and
preview illustrations while retaining declarations as its source of truth.
