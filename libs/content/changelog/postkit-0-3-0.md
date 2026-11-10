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

## Changed

- `@postkit/react` renders headless views for every static component.
  Interactive components whose behaviour isn't shared yet stay Chakra-only
  until 0.3.x, and the component manifest marks them.
- Chakra recipes follow the host's colour mode, with dark values for every
  colour in `postkitDefaultTheme`.
- Email support is computed from what the email renderer exports, and every
  component declares an email fallback.
- Callout accepts `type` as an alias for `tone` in directives.

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
