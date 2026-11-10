---
title: Email
summary: Send the post as a newsletter without rewriting it.
category: Renderers
order: 3
since: '0.3.0'
status: draft
---

Your posts already have callouts, figures and footnotes. `@postkit/email`
turns the same file into an email that looks right in Gmail, Outlook and Apple
Mail, so the newsletter is never a second draft.

## Render a post

`renderEmail` takes an authored post and returns email-safe HTML, a plain-text
version and any warnings:

```ts
// scripts/send-issue.ts
import { renderEmail } from '@postkit/email';

const { html, text, warnings } = await renderEmail(post.body, {
  format: 'mdx',
  baseUrl: 'https://example.com',
});

await newsletter.send({ subject: post.title, html, text });
```

Hand `html` and `text` to any provider. Postkit never sends anything itself.

{/* TODO(0.3.0): the SiteDocsEmail board passes a `postkit` option (the site's createPostkit instance) instead of `format`. Spec 03 §6.1 has no `postkit` option. Confirm the final signature and update this sample. */}

## Options

| Option       | Description                                                             |
| ------------ | ----------------------------------------------------------------------- |
| `format`     | `'mdx'`, `'markdown'` or `'document'` (a `@postkit/core` document).     |
| `theme`      | Optional Chakra Email theme. Defaults to the light Postkit email theme. |
| `baseUrl`    | Resolves relative links and images, such as `'https://example.com'`.    |
| `components` | Optional overrides, keyed by definition, the same as on your site.      |
| `wrapper`    | Optional layout component for the header, footer and unsubscribe link.  |

It resolves to `{ html, text, warnings }`.

## How it works

`renderEmail` parses the post with `@postkit/core`, using the same validation
as your site. It maps each component to its email view, or to the component's
declared fallback, and renders the result with Chakra Email's `render()`.

It doesn't depend on a framework. Email is rendered in scripts, scheduled jobs
and queue workers as often as in a page, so `renderEmail` lives in
`@postkit/email`, not in the framework adapters.

Email always renders in the light theme. Email clients apply their own dark
mode.

## What's supported

| Components                       | Status    | In the inbox                                 |
| -------------------------------- | --------- | -------------------------------------------- |
| Callout · Aside · CallToAction   | Supported | Table layout, inline styles, your tones      |
| Figure · Audio · Video           | Supported | Image with caption; media as a linked poster |
| KeyTakeaway · PullQuote · Steps  | Next      | Planned for 0.3.x                            |
| Stat · ProductCard · LinkPreview | Next      | LinkPreview as a static card                 |
| Footnotes                        | Supported | Numbered notes at the end, no links          |
| Everything else                  | Fallback  | Declared per component: link, text or omit   |

The status on each component page is computed from what `@postkit/email`
exports, so it can't drift out of date. Footnotes always render as end notes
with superscript numbers and no links, because in-message anchors are
unreliable across clients.

## Fallbacks

Interactive components can't run in an inbox. Each one declares what to do
instead, so a newsletter never shows a broken widget:

| Fallback | What readers see                              | Used by                        |
| -------- | --------------------------------------------- | ------------------------------ |
| `link`   | A short line linking to the post on your site | Poll, Tabs, CodeGroup          |
| `text`   | The content as plain, readable text           | Disclosure, Comparison         |
| `omit`   | Nothing; the block is skipped                 | ShareActions, NewsletterSignup |

When a fallback applies, or a component is unknown, `renderEmail` adds an entry
to `warnings`. It never throws on content your site renders.

{/* TODO(0.3.0): the "Used by" column comes from the SiteDocsEmail board. Confirm each component's declared email fallback in its definition. */}

## Today's API

Until `renderEmail` lands, `@postkit/email` exports the email views and a
provider, and you call Chakra Email's `render()` yourself:

```tsx
import { render } from '@chakra-email/core';
import { Callout, CallToAction, PostkitEmailProvider } from '@postkit/email';

const html = await render(
  <PostkitEmailProvider>
    <Callout title="Before you publish" tone="warning">
      Review the destination and audience.
    </Callout>
    <CallToAction
      title="Read the field guide"
      primaryLabel="Read now"
      primaryHref="https://example.com/guide"
    />
  </PostkitEmailProvider>,
);
```

The package exports:

- Views: `Aside`, `Audio`, `Callout`, `CallToAction`, `Figure` and `Video`.
- `PostkitEmailProvider`, which accepts Chakra Email theme overrides.
- `createPostkitEmailMdxComponents()` and `postkitEmailMdxComponents`, the MDX
  map for the supported subset, for email builds that compile trusted MDX.
- `createPostkitEmailAction`, `createPostkitEmailMediaModel` and
  `numericEmailDimension`, small helpers that normalize props for email.

Audio and Video never emit native media elements, because major email clients
don't support them consistently.
