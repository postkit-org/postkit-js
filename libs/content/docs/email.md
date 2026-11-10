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
  definitions: postkit.definitions, // your createPostkit() set
});

await newsletter.send({ subject: post.title, html, text });
```

Hand `html` and `text` to any provider. Postkit never sends anything itself.

## Options

| Option        | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `format`      | `'mdx'`, `'markdown'` or `'document'` (a `@postkit/core` document).                |
| `theme`       | Optional Chakra Email theme. Defaults to the light Postkit email theme.            |
| `baseUrl`     | Resolves relative links and images, such as `'https://example.com'`.               |
| `components`  | Optional overrides, keyed like your MDX map: components by name, prose by element. |
| `wrapper`     | Optional layout component for the header, footer and unsubscribe link.             |
| `definitions` | The components the post may use. Defaults to every built-in.                       |
| `url`         | The post on your site, where `link` fallbacks point.                               |

It resolves to `{ html, text, warnings }`. To use only part of a post, as a
digest does, call `parseEmailSource` first, pick the nodes you want, and pass
the result with `format: 'document'`.

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
| KeyTakeaway · PullQuote · Steps  | Supported | Boxed summary, ruled quote, numbered rows    |
| Stat · ProductCard · LinkPreview | Supported | LinkPreview as a static card, never an embed |
| Footnotes                        | Supported | Numbered notes at the end, no links          |
| Everything else                  | Fallback  | Declared per component: text, link or omit   |

The status on each component page is computed from what `@postkit/email`
exports, so it can't drift out of date. Footnotes always render as end notes
with superscript numbers and no links, because in-message anchors are
unreliable across clients. The plain-text part marks them `[1]`.

## Fallbacks

Interactive components can't run in an inbox. Each one declares what to do
instead, so a newsletter never shows a broken widget:

| Fallback | What readers see                                    | Used by                                                                                                                                                                                                             |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`   | The content as plain, readable text, code and links | AppearsOn, AudienceBoundary, AuthorCard, CardGrid, Carousel, Chart, CodeBlock, CodeGroup, Comparison, Diff, Disclosure, FileCard, FileTree, Gallery, RelatedContent, SeriesNavigation, SponsorBlock, Tabs, Terminal |
| `link`   | A short line linking to it on the web               | Poll (to your post), SocialPost (to the post itself)                                                                                                                                                                |
| `omit`   | Nothing; the block is skipped                       | ShareActions, NewsletterSignup                                                                                                                                                                                      |

Your own components declare one the same way, with `email: { fallback: 'text' }`
in `definePostkitComponent`. When a fallback applies, or a component is
unknown, `renderEmail` adds an entry to `warnings`. It never throws on content
your site renders.

## Views and the provider

`renderEmail` is built from parts you can use directly. The package exports:

- Views: `Aside`, `Audio`, `Callout`, `CallToAction`, `Figure`, `KeyTakeaway`,
  `LinkPreview`, `ProductCard`, `PullQuote`, `Stat`, `Steps` and `Video`, and
  `postkitEmailViews`, the map of all of them that the manifest's
  `support.email` is computed from.
- `PostkitEmailProvider`, which applies `postkitEmailTheme` (light, with
  literal `tone.*` and `tint.*` colours) and accepts Chakra Email theme
  overrides on top, such as your own tones.
- `createPostkitEmailMdxComponents()` and `postkitEmailMdxComponents`, the MDX
  map of the views, for email builds that compile trusted MDX.
- `parseEmailSource`, the parsing step of `renderEmail`.

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

Audio and Video never emit native media elements, because major email clients
don't support them consistently.
