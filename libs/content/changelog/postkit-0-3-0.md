---
title: Postkit 0.3.0
subtitle: Bring your own design system.
version: 0.3.0
status: upcoming
# TODO(PK-072): stand-in date. Set the real release date, and flip `status` to `released`,
# when 0.3.0 publishes (03 §8 step 12). Upcoming entries show "Not yet released" instead.
date: 2026-12-01
summary: Postkit renders headless by default, with Chakra as its own package, and every component can be restyled, overridden or ejected without forking.
tags:
  - components
  - theming
  - customization
  - email
---

# Postkit 0.3.0

This release separates what a component _is_ from how it looks. Definitions
live in `@postkit/core`, `@postkit/react` renders them as headless views, and
today's Chakra components move to `@postkit/chakra`. Your posts don't change.

:::postkit-callout{title="One deliberate break" tone="warning"}
`@postkit/react` is headless from 0.3.0, with no compatibility shim. If you use
the Chakra views, switch the import to `@postkit/chakra`. It's the one
deliberate break before 1.0.
:::

## Added

- `createPostkit` and kits: enable only the components you use, and ship only
  those.
- Defaults, slot parts and views: change what authors get with `defaults` in
  `createPostkit`, swap one part, or replace the render, all without ejecting.
- `postkit eject` and `postkit diff`, from the new `@postkit/cli`: own a
  component's source and still see what changed upstream.
- Footnotes and sidenotes, carried through every renderer including email.
- An optional `styles.css` baseline for the headless views, driven by
  `--postkit-*` tokens.
- `renderEmail()` in `@postkit/email`, which turns a Markdown, MDX or
  `@postkit/core` document into email HTML and plain text.
- `Device`, a screenshot in a plain iPhone, iPad or Mac frame drawn with CSS
  (`kind`, `src`, `alt`, `caption`). It's experimental.
- `Carousel` `presentation="peek"`: the current item centred with its
  neighbours faded either side, arrows only, and its caption announced to
  screen readers. Like every carousel, it never advances on its own.
- `Gallery` `presentation="row"`: two or three related pictures side by side,
  which become a swipeable rail on phones.
- `Video` `captions` (a WebVTT track), `captionsLang`, `duration` and
  `decorative`.
- Figure numbering: `<PostkitProvider figures="numbered">` labels figures,
  videos and devices "Fig. 1", "Fig. 2"…, and the items of a carousel or
  gallery "Fig. 3", "Fig. 3b", "Fig. 3c".

## Changed

- `@postkit/react` renders headless views for all 38 built-in components,
  including interactive components. Headless and Chakra views share the same
  component anatomy and behaviour contracts.
- Chakra recipes follow the host's colour mode, with dark values for every
  colour in `postkitDefaultTheme`.
- Every component now defaults to the subtle variant (D12). Pass
  `variant="outline"`, or set `defaults` in `createPostkit`, to keep the 0.2
  look.
- Email support is computed from what the email renderer exports, and every
  component declares an email fallback.
- Callout accepts `type` as an alias for `tone`, in directives and in MDX.
  `tone` stays the documented prop, and wins if both are set.
- A `Video` without a captions track now gets a warning, in development and in
  your build output, unless you mark it `decorative`. It never fails the
  build, even in strict mode, so this isn't a breaking change.
- Poll, Chart and SocialPost are marked experimental in the component
  manifest until they've been reviewed.

## Removed

- The unused `async`, `colors`, `strings` and `utils` packages.

## Migrating from 0.2

If you render with Chakra, change one import. Component names and props are
unchanged.

```ts title="lib/postkit.ts"
// 0.2
import { Callout, PostkitProvider } from '@postkit/react';

// 0.3
import { Callout, PostkitProvider } from '@postkit/chakra';
```

Want only the components you use? Move to `createPostkit` when you're ready.
The old exports keep working through 0.x.
