# @postkit/core

Portable, versioned Postkit documents for moving structured content between
HTML, Markdown, MDX, JSON, and renderers without depending on React.

```ts
import { parsePostkit, serializePostkit } from '@postkit/core';

const document = parsePostkit(feedItem.content, { format: 'html' });
const json = serializePostkit(document, { format: 'json' });
```

The HTML and MDX parsers are intentionally non-executable. They preserve safe
semantic content and recognized Postkit annotations while discarding scripts,
event handlers, unsafe URLs, and MDX expressions.

## Formats

- `parsePostkitHtml(source)` normalizes untrusted HTML into semantic nodes.
- `parsePostkitMarkdown(source)` supports CommonMark and GFM lists, tables,
  autolinks, strikethrough and footnotes. `[^id]`, `:footnote[…]` and
  `<Footnote>…</Footnote>` become `footnoteReference` and `footnoteDefinition`
  nodes; a reference with no definition fails with its line and column.
  `resolvePostkitFootnotes` numbers notes by first reference and
  `validatePostkitFootnotes` reports missing and unreferenced notes.
- `parsePostkit(source, { format: 'mdx' })` supports literal MDX components and
  rejects expressions, spread props, imports, and exports.
- `parsePostkitJson(source)` validates the versioned document format.
- `serializePostkit(document, { format })` writes HTML, Markdown, MDX, JSON, or
  plain text.
- `serializePostkitText(document)` writes readable plain text, for email text
  parts and `llms` files.

HTML serialization normalizes and allowlists semantic attributes. URL attributes
must be strings with safe schemes; arrays cannot bypass URL validation.

Reference links and images resolve their Markdown definitions. Mixed inline HTML
is parsed as a complete stream, retaining Markdown formatting between tags and
passing the resulting tree through the HTML safety filter.

Markdown export escapes literal block markers, entities, and link/image
destinations so text and URLs retain their meaning when reparsed. Task items
export as disabled HTML checkboxes; HTML import recognizes leading checkboxes
inside list items (including paragraph-wrapped GFM output) and recovers both
checked and unchecked state.

Annotated HTML preserves Postkit component names and JSON-compatible props in
`data-postkit-*` attributes. Serialization does not add a document wrapper by
default; request one with `documentElement` when a transport needs a single
root.

```ts
import { parsePostkitHtml, serializePostkitHtml } from '@postkit/core';

const document = parsePostkitHtml(rssItem.content);
const portableHtml = serializePostkitHtml(document, {
  documentElement: 'article',
});
```

Plain Markdown uses annotated HTML fallbacks for structures Markdown cannot
represent. MDX output uses literal component tags and serialized data props;
it never emits JavaScript expressions.

### Static component views

The HTML and plain-text serializers render each built-in component through a
framework-free static view driven by its definition, so a feed reader, an email
client or an `llms` file sees real content, including text carried in props
(titles, captions, attributions). Views emit the anatomy attributes
(`data-postkit-component` and the theme-variant state on the root,
`data-postkit-part` on each part), and never a script, form, embed or iframe.
Every prop value is escaped, and URLs from props must be http, https, mailto or
relative; anything else is dropped. Provider `rawHtml` and embed HTML in
`metadata` are never used.

With annotations (the default), the root also carries `data-postkit-props` and
`data-postkit-view`, and the element holding authored children is marked
`data-postkit-slot`. `parsePostkitHtml` drops the generated markup and recovers
the component node exactly. Custom components keep the plain carrier element
(`componentElement`), and MDX output keeps literal component tags.

```ts
import { serializePostkitHtml, serializePostkitText } from '@postkit/core';

const options = {
  baseUrl: 'https://postkit.org', // relative links and media become absolute
  audiences: ['public'], // AudienceBoundary shows other audiences its fallback
  newsletterUrl: 'https://postkit.org/subscribe', // NewsletterSignup links here
};
const html = serializePostkitHtml(document, options);
const text = serializePostkitText(document, options);
```

| Component        | Static HTML                                                                        | Fallback choice                                                |
| ---------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| AppearsOn        | `<aside>`: label, list of destination links with dates and non-published status    | —                                                              |
| Aside            | `<aside>`: title paragraph and body                                                | —                                                              |
| AudienceBoundary | `<div>`: optional label, then the content                                          | With `audiences` set, other audiences get the fallback copy    |
| Audio            | `<figure>`: title, native `<audio controls>` with a link fallback, caption         | —                                                              |
| AuthorCard       | `<aside>`: portrait, name (linked), role, bio or children, profile links           | —                                                              |
| CallToAction     | `<aside>`: eyebrow, title, body or description, action links                       | —                                                              |
| Callout          | `<aside>`: title paragraph and body                                                | —                                                              |
| CardGrid         | `<div>`: heading, then one `<article>` per card with image, text and link          | —                                                              |
| Carousel         | `<section>`: every slide as a `<figure>` with its caption and link, then children  | All slides shown in order; no controls                         |
| Chart            | `<figure>`: title, description and the source data as a `<table>`                  | A data table instead of the SVG plot                           |
| CodeBlock        | `<figure>`: filename caption and `<pre><code class="language-…">`                  | No highlighting, line numbers or copy button                   |
| CodeGroup        | `<div>`: each example as a `<figure>` with its label and `<pre><code>`             | All examples shown in order; no tabs                           |
| Comparison       | `<div>`: title, description and a `<table>` (Yes, No or the value)                 | —                                                              |
| Diff             | `<div>`: title and `<pre><code>` with one line per change                          | —                                                              |
| Disclosure       | Native `<details>` with `<summary>`                                                | —                                                              |
| Figure           | `<figure>`: `<img>` (linked when `href` is set) and caption with credit            | —                                                              |
| FileCard         | `<div>`: name, description, type and size, download link                           | —                                                              |
| FileTree         | `<div>`: title and a list of full paths (folders end in `/`)                       | Full paths instead of an indented tree                         |
| Footnote         | `<sup>`: the mark, linked to its note (`footnoteReference` nodes)                  | `footnotes: { links: false }` (email) drops the links          |
| Footnotes        | `<section>`: title, rule and the notes as an `<ol>` with ↩ backlinks               | Always the end list; side, popover and inline need a renderer  |
| Gallery          | `<div>`: heading, then one `<figure>` per image with its caption                   | —                                                              |
| KeyTakeaway      | `<aside>`: eyebrow, title, body and the items as a list                            | —                                                              |
| LinkPreview      | A link card: image, linked title, description, site name and domain                | Never an embed, iframe or player; `inline` is a plain link     |
| NewsletterSignup | `<aside>`: title, description, children and a "Subscribe" link to `newsletterUrl`  | Left out without `newsletterUrl`; a form can't work statically |
| Poll             | `<div>`: question, description and the options as a list, with any vote counts     | Lists the options; no voting                                   |
| ProductCard      | `<article>`: image, badge, title, description, rating, price and action link       | —                                                              |
| PullQuote        | `<figure>`: `<blockquote>` and `<figcaption>` with attribution and `<cite>`        | —                                                              |
| RelatedContent   | `<aside>`: title and a list of links with descriptions                             | —                                                              |
| SeriesNavigation | `<nav>`: series title, position and previous and next links                        | —                                                              |
| ShareActions     | `<p>`: the label and a link to the shared URL                                      | One link instead of share buttons                              |
| SocialPost       | `<figure>`: post text in a `<blockquote>`, author, time and a link to the original | Never the provider embed                                       |
| SponsorBlock     | `<aside>`: disclosure, logo, name, message and sponsored link                      | —                                                              |
| Stat             | `<dl>`: label, value, trend and description                                        | —                                                              |
| Steps            | `<ol>`: each step's title and description                                          | —                                                              |
| Tabs             | `<div>`: every panel as a `<section>` led by its label                             | All panels shown in order; no tabs                             |
| Terminal         | `<figure>`: title caption and `<pre><code>` with prompt, command and output        | —                                                              |
| Video            | `<figure>`: native `<video controls>` with poster and a link fallback, caption     | —                                                              |

Decorative marks (icons, quote marks, window dots, step markers) are left out:
without styles they would read as stray characters. Authored children of a
component whose definition takes none still follow its markup, so nothing
authored is lost.

`serializePostkitText` renders the same views as text: paragraphs separated by
blank lines, `-` and `1.` list markers, `>` for quotes, `A | B` table rows,
code kept verbatim, images as `[alt]` and links as `label (url)`. Footnotes
become `[1]` marks and a `[1] Note` list where `Footnotes` is placed, or at
the end.

MDX serialization escapes literal braces and ESM-like text, keeps code fences
isolated, and validates the generated syntax with the non-executable parser.
Unrepresentable or executable output fails closed rather than returning unsafe
MDX for a downstream compiler.

Documents use an explicit `version` so future schema changes can be migrated
without guessing which representation a consumer received.

Parsing makes content non-executable, but an application still controls the
component registry used to render component nodes and should expose only
components appropriate for its trust boundary.

## Component definitions

`@postkit/core/components` holds the framework-free contract for Postkit
components: their props, anatomy (slots), directive and catalog metadata. It has
no React, Chakra or parser dependency, so editors, manifest tooling and email
builds can read it on their own.

```ts
import {
  definePostkitComponent,
  presentation,
  prop,
  type PostkitPropsOf,
  type PostkitSlotOf,
} from '@postkit/core/components';

export const calloutDefinition = definePostkitComponent({
  name: 'Callout',
  directive: 'postkit-callout',
  category: 'article-structure',
  description: 'A highlighted note, tip, warning, or caution.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  props: {
    ...presentation,
    title: prop.string('An optional heading.'),
    tone: prop.enum(['note', 'tip', 'important', 'warning', 'caution'], {
      description: 'The semantic emphasis.',
      default: 'note',
      themeVariant: true,
    }),
  },
  slots: ['root', 'icon', 'content', 'title', 'body'],
  example: { props: { tone: 'tip' }, children: 'Keep the content.' },
});

type CalloutProps = PostkitPropsOf<typeof calloutDefinition>;
type CalloutSlot = PostkitSlotOf<typeof calloutDefinition>;
```

- `definePostkitComponent(definition)` validates the definition and returns it
  deeply frozen, with `children` (`none`), `runtime` (`static`), `stability`
  (`initial`) and `keywords` filled in, and `themeVariants` listing the props
  marked `themeVariant`.
- `prop.string`, `prop.number`, `prop.boolean`, `prop.enum` and `prop.json`
  build props. Each takes a description and optional `required` and `default`;
  `prop.enum` and `prop.boolean` also take `themeVariant`.
- `presentation` is the shared `size` (default `md`) and `variant` (default
  `subtle`) pair.
- `email: { fallback: 'text' | 'link' | 'omit' }` declares what
  `@postkit/email`'s `renderEmail` does when it has no view for the component
  (03 §6): its static view as text, a link to it on the web, or nothing.
- `PostkitPropsOf`, `PostkitSlotOf`, `PostkitThemeVariantOf`,
  `PostkitThemeKeyOf` and `PostkitRecipeKeyOf` derive view props, slot and
  variant unions, and theme and recipe keys from a definition.
  `PostkitPropsOf` is what a view receives, so a prop with a `default` is
  non-optional; `PostkitAuthoredPropsOf` is what an author writes, where only
  `required` props are required.
- `postkitBuiltInDefinitions` maps each built-in component name to its
  definition, and each definition is also exported on its own, such as
  `calloutDefinition`.

### The component manifest

`createPostkitComponentManifest(components, { renderers })` generates the
`postkit.component-catalog` v2 manifest for exactly the definitions given:
v1's fields plus `package`, `kit`, `stability`, `slots`, `variants`, a
computed `support`, and each prop's `default` and `themeVariant`. `renderers`
lists the views each renderer package exports (`headless`, `chakra`, `email`);
`support.email` is `supported`, the definition's declared `{ fallback }`, or
`not-supported`, and is left out when `renderers.email` isn't given.
`createPostkit().manifest()` and `@postkit/chakra/component-manifest.json`
both use it.

v1 stays readable: `readPostkitComponentManifest(json)` accepts either
version and returns v2, `isPostkitComponentManifestV1` and
`isPostkitComponentManifestV2` tell them apart, and
`mergePostkitComponentManifests` combines manifests.

## Behaviours

`@postkit/core/behaviors` holds the behaviour of Postkit's interactive
components as framework-free state machines, so React hooks, custom elements
and tests all run the same logic:

| Behaviour      | Engine           | Postkit configuration                                                    |
| -------------- | ---------------- | ------------------------------------------------------------------------ |
| `carousel`     | Zag `carousel`   | One slide per page, no gap, wraps at both ends, mouse drag               |
| `tabs`         | Zag `tabs`       | Horizontal; arrow keys, Home and End select as focus moves               |
| `codeCopy`     | Zag `clipboard`  | "Copied" feedback for one second                                         |
| `embedConsent` | Plain TypeScript | `idle` → `requested` → `loaded`; `click` activation waits for the reader |

```ts
import { createTabs, spreadProps } from '@postkit/core/behaviors';

const tabs = createTabs({ id: 'install', values: ['npm', 'pnpm'] });
const render = () => spreadProps(list, tabs.api.getListProps()); // …each part
render();
tabs.subscribe(render);
tabs.start();
```

- `createCarousel`, `createTabs`, `createCodeCopy` and `createEmbedConsent`
  return a running behaviour: `api`, `start`, `stop` and `subscribe`.
  `spreadProps` applies an API's props to DOM elements; `examples/behaviors`
  shows the whole loop.
- For framework adapters, each Zag behaviour also exports its machine, its
  `connect` and its props (`tabsMachine`, `connectTabs`, `tabsProps(options)`),
  so a React hook is `connectTabs(useMachine(tabsMachine, tabsProps(options)),
normalizeProps)`. Embed consent exports `embedConsentTransition` and
  `connectEmbedConsent` for the same purpose.
- `createMachineService` runs any flat Zag machine without a UI framework.

The `@zag-js/*` packages are optional peer dependencies at `^1.27.0`, the range
`@chakra-ui/react` 3.29 and later resolve through Ark UI, so a Chakra host
installs one copy. Install `@zag-js/carousel`, `@zag-js/tabs`,
`@zag-js/clipboard`, `@zag-js/core` and `@zag-js/types` yourself when you use
`/behaviors` without Chakra. The root `@postkit/core` entry never imports them.

### Shared behaviour specs

`@postkit/core/behaviors/testing` exports one spec per behaviour
(`carouselBehaviorSpec`, `tabsBehaviorSpec`, `codeCopyBehaviorSpec`,
`embedConsentBehaviorSpec`). Every renderer runs them against its own
components through a `BehaviorDriver`: `render(fixture)` returns the rendered
container, `interact(action)` runs a DOM interaction and lets the renderer
settle, `waitFor(assertion)` retries, and `cleanup()` unmounts. The specs read
state only from the DOM (roles, ARIA and `data-*` attributes, text), have no
test-runner dependency, and emulate the layout and observers jsdom lacks.

```ts
import {
  registerBehaviorSpec,
  tabsBehaviorSpec,
} from '@postkit/core/behaviors/testing';

registerBehaviorSpec(tabsBehaviorSpec(myDriver), { describe, it });
```

## License

MIT
