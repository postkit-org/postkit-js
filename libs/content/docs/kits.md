---
title: Kits
summary: Choose the components your writers need, and ship only those.
category: Get started
order: 4
since: '0.3.0'
status: draft
---

A kit is a named set of component definitions. Postkit's 38 components come in
six kits, and you turn on the ones your writers use. Only those components are
bundled, validated and described in your manifest.

## The six kits

| Kit          | Import                           | Components                                                                                                       |
| ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `article`    | `@postkit/react/kits/article`    | Aside, AudienceBoundary, Callout, CardGrid, Disclosure, Footnote, Footnotes, KeyTakeaway, PullQuote, Steps, Tabs |
| `technical`  | `@postkit/react/kits/technical`  | Chart, CodeBlock, CodeGroup, Comparison, Diff, FileCard, FileTree, Stat, Terminal                                |
| `media`      | `@postkit/react/kits/media`      | Audio, Carousel, Device, Figure, Gallery, Video                                                                  |
| `discovery`  | `@postkit/react/kits/discovery`  | AppearsOn, AuthorCard, LinkPreview, RelatedContent, SeriesNavigation, SocialPost                                 |
| `engagement` | `@postkit/react/kits/engagement` | CallToAction, NewsletterSignup, Poll, ShareActions                                                               |
| `publishing` | `@postkit/react/kits/publishing` | ProductCard, SponsorBlock                                                                                        |

All six are also exported together from `@postkit/react/kits`. Each component
page shows which kit it belongs to.

{/* TODO(0.3.0): Footnote and Footnotes have no component pages yet (03 §7.1, D13). */}

## Turn kits on

Pass the kits to `createPostkit`:

```ts
// lib/postkit.ts
import { createPostkit } from '@postkit/react';
import { article, technical } from '@postkit/react/kits';

export const postkit = createPostkit({
  kits: [article, technical],
});
```

Kits are renderer-neutral. They list definitions, and each renderer package
supplies the views for them, so the same kits work with the Chakra renderer:

```ts
import { createPostkit } from '@postkit/react';
import { article, technical, media } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
});
```

## Leave one out

Use `exclude` to drop a component from a kit you otherwise want:

```ts
import { createPostkit } from '@postkit/react';
import { article, engagement } from '@postkit/react/kits';

export const postkit = createPostkit({
  kits: [article, engagement],
  exclude: ['Poll'],
});
```

## What a kit changes

The set you enable is the set everything else uses:

- `postkit.mdxComponents` contains only the enabled components, plus prose.
- `postkit.remarkPlugins` validates directives against the enabled set, so a
  post that uses a component you didn't turn on fails the build the same way a
  misspelled one does (see [Validation](/docs/validation)).
- `postkit.manifest()` describes exactly the enabled set, so editors like
  Prismark offer writers only what your site renders.

An excluded or not-enabled component fails strict validation like an
unknown one, and the error says it isn't enabled. With `strict: false` it's a
warning, as for any unknown component.

On the headless renderer, a `chakra-only` component in a kit (an interactive
component still waiting for its headless view) stays out of the manifest.
Using it fails the build in every mode, with an error naming the component.

## Add your own

Your own components and third-party packages join the set through
`components`, next to the kits. See [New components](/docs/new-components).

## Compatibility

The `@postkit/react` root still exports every component for 0.x
compatibility, and individual components stay importable for full
tree-shaking. Kits are the recommended way to choose a set.
