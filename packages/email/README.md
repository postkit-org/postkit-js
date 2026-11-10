# `@postkit/email`

Email-safe Postkit renderers built with `@chakra-email/core`. The package keeps
portable Postkit content recognizable while deliberately adapting interactive
web components to the constraints of delivered HTML email.

## Install

```sh
npm install @postkit/email @chakra-email/core react react-dom
```

## Render a post: `renderEmail`

`renderEmail(source, options)` turns an authored post into an email (03 §6.1):

```ts
import { renderEmail } from '@postkit/email';

const { html, text, warnings } = await renderEmail(post.body, {
  format: 'mdx', // 'mdx' | 'markdown' | 'document' (a @postkit/core document)
  baseUrl: 'https://example.com', // resolves relative links and images
  url: 'https://example.com/notes/hello', // where `link` fallbacks point
  theme, // optional Chakra Email tokens over postkitEmailTheme
  components, // optional overrides: views by name, prose by element (`h2`, `p`…)
  definitions, // optional: createPostkit().definitions; defaults to the built-ins
  wrapper: Layout, // optional layout: header, footer, unsubscribe link
});
```

- **Parse.** Markdown and MDX go through the site's own Remark preset and
  `remarkPostkit` validation (`@postkit/react/remark`), then `@postkit/core`'s
  safe MDX parser, so directives become components. Invalid props still fail,
  as on the site; unknown components, MDX code (`import`, `{expressions}`) and
  dangling footnotes become warnings instead. Literal values such as
  `items={[…]}` are kept as data.
- **Map.** Each component renders with its view from `postkitEmailViews` (or
  your `components`), or, when there's none, its definition's declared
  fallback (below). Elements render with Chakra Email primitives: tables and
  inline styles, no CSS variables.
- **Render.** Chakra Email's `render()` inside `PostkitEmailProvider`, in your
  `wrapper` or a plain 600px column. `text` comes from `@postkit/core`'s
  `serializePostkitText`, with the same decisions as the HTML.
- **Warnings.** `{ code, message, component?, line?, column? }`. Codes:
  `email-fallback`, `unknown-component`, `mdx-expression`, `mdx-esm`,
  `footnote`, `parse`, or a `remarkPostkit` rule such as `unknown-prop`. It
  never throws on content the site renders.
- **Footnotes** are end notes: superscript numbers without links (in-message
  anchors are unreliable across clients), and a numbered "Notes" list at the
  end. The plain text marks them `[1]`.

The same call is compiled in CI from
[`examples/email/render-post.tsx`](../../examples/email/render-post.tsx).

`parseEmailSource(source, options)` is the parsing step on its own: it returns
`{ document, warnings }`, so a digest can pick parts of a post and render them
with `format: 'document'`.

### Email support and fallbacks

A component is `email: supported` in the manifest when this package exports a
view for it (`postkitEmailViews`). Every other built-in declares a fallback in
its definition (`email: { fallback }`), which `renderEmail` applies with a
`email-fallback` warning:

| Component                                                                                                                                                                                                           | Email                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aside, Audio, Callout, CallToAction, Figure, KeyTakeaway, LinkPreview, ProductCard, PullQuote, Stat, Steps, Video                                                                                                   | `supported`: an email view                                                                 |
| AppearsOn, AudienceBoundary, AuthorCard, CardGrid, Carousel, Chart, CodeBlock, CodeGroup, Comparison, Diff, Disclosure, FileCard, FileTree, Gallery, RelatedContent, SeriesNavigation, SponsorBlock, Tabs, Terminal | `text`: the static view (`serializePostkitHtml`) as prose; code, links and images survive  |
| Poll, SocialPost                                                                                                                                                                                                    | `link`: its own URL (SocialPost) or the post on the web (`url`); text when there's neither |
| NewsletterSignup, ShareActions                                                                                                                                                                                      | `omit`: left out; the reader is already subscribed, and share buttons don't work in a mail |

Why: `text` keeps anything whose words, code or links read fine in order
(tabs and code groups become consecutive panels, a disclosure is shown open,
a chart its data table). `link` is for content that only exists on the web: a
poll needs the page to vote, and an embedded post is better seen where it
lives. `omit` is for controls with no meaning in an inbox. A component with
no view and no declared fallback (a site's own) renders as text, with a
warning.

## Render views yourself

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

The same integration is compiled in CI from
[`examples/email/render-newsletter.tsx`](../../examples/email/render-newsletter.tsx).

`PostkitEmailProvider` applies `postkitEmailTheme`, a light email theme with
literal colours for every tone, over Chakra Email's defaults, then layers your
`theme` prop on top. It does not load Chakra UI or install a client-side
runtime.

## Theme

Email stays light; mail clients apply their own dark mode. Every colour is
written inline as a literal value, never a CSS variable.

| Key           | Used for                     | Default                                            |
| ------------- | ---------------------------- | -------------------------------------------------- |
| `tone.<tone>` | Callout and Aside border     | Chakra UI `<palette>.700`, as in `@postkit/chakra` |
| `tint.<tone>` | Callout and Aside background | The tone at 12% over white                         |
| `fg`          | Callout and Aside text       | `#18181b`                                          |

Tones are `note`, `tip`, `important`, `warning` and `caution`. Override any of
them with the same key:

```tsx
<PostkitEmailProvider
  theme={{ colors: { tone: { tip: '#23794a' }, tint: { tip: '#e5efe9' } } }}
>
  {children}
</PostkitEmailProvider>
```

## Supported components

| Portable component | Email behavior                                         |
| ------------------ | ------------------------------------------------------ |
| `Aside`            | Expanded callout                                       |
| `Callout`          | Expanded, tone-aware callout                           |
| `CallToAction`     | Text plus email-safe button and secondary link         |
| `Figure`           | Sanitized image, optional destination, caption/credit  |
| `Audio`            | Title, caption, and a link to listen                   |
| `Video`            | Optional linked poster, title, caption, and watch link |
| `KeyTakeaway`      | Boxed eyebrow, title, body and list of points          |
| `PullQuote`        | Large quotation with a rule and attribution            |
| `Steps`            | Numbered table rows, no list markers                   |
| `Stat`             | Label, large value, trend and description              |
| `ProductCard`      | Image, badge, title, rating, price and a button        |
| `LinkPreview`      | Static card from resolved metadata, never an embed     |

Audio and video never emit native media elements because major email clients
do not support them consistently. Chakra Email sanitizes authored link and
image destinations when the HTML is rendered.

## MDX mapping

Use the explicit map of the views when an email build compiles trusted MDX
(`postkitEmailViews` is the same set, keyed by definition):

```ts
import { createPostkitEmailMdxComponents } from '@postkit/email';

export const components = createPostkitEmailMdxComponents();
```

This package does not evaluate MDX, fetch remote metadata, or accept provider
credentials. Compile authored content and resolve link metadata in a trusted
server or build step before rendering.

## Architecture boundary

The renderer-specific JSX intentionally lives here rather than substituting
Chakra Email for Chakra UI at compile time. Small normalization functions in
the package are framework-neutral and are candidates for a future shared
`@postkit/core` package as the email support matrix expands.
