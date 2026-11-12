# Portable documents and feeds

Normalize HTML, Markdown, MDX, or JSON and render it through a host Chakra system.

Use `@postkit/core` when an API or feed needs to offer the same article as
HTML, Markdown, MDX, or versioned JSON. The package has no React dependency.

```ts
import { parsePostkit, serializePostkit } from '@postkit/core';

const document = parsePostkit(input, { format: 'html' });

return {
  html: serializePostkit(document, { format: 'html' }),
  markdown: serializePostkit(document, { format: 'markdown' }),
  json: serializePostkit(document, { format: 'json' }),
};
```

The HTML parser keeps safe semantic structure and strips scripts, event
handlers, presentation attributes, and executable URLs. The safe MDX parser
accepts literal component tags but rejects expressions, spread props, imports,
and exports. JSON input must match the current versioned document schema.

Task lists retain checked and unchecked state through HTML using disabled
checkboxes. Markdown exports escape literal block markers, entities, and link
destinations to preserve their meaning. Footnotes are portable: `[^id]` and
`:footnote[…]` become `footnoteReference` and `footnoteDefinition` nodes,
numbered by first reference. HTML gets linked marks and an end list with
backlinks (ids prefixed by `footnotes.scope`), plain text gets `[1]` marks
and a numbered list, and a reference with no definition fails with its line
and column.

## Render through Chakra

`@postkit/chakra/document` supplies `DocumentRenderer`. Semantic input is mapped
through Postkit's Chakra-backed prose primitives, so the host's Heading, List,
Table, Image, Code, and other recipes continue to apply.

```tsx
import { DocumentRenderer, parsePostkitHtml } from '@postkit/chakra/document';

const document = parsePostkitHtml(rssItem.content);

<PostkitProvider system={siteSystem}>
  <DocumentRenderer
    document={document}
    components={{
      a: SiteLink,
      img: FeedImage,
    }}
  />
</PostkitProvider>;
```

The renderer never creates arbitrary elements or invokes unknown components.
Unknown nodes are unwrapped by default, retaining readable children. Use the
`unknownElements` and `unknownComponents` props to drop them instead.

## Reconstruct rendered output

`DocumentRenderer`'s component views load the first time a document renders
them, so a page downloads only the views its document uses. A server render
that waits for Suspense (as Next.js does) has them in its HTML; for a
synchronous render, pass `components={postkitChakraViews}`.

HTML serialization and `DocumentRenderer` emit versioned `data-postkit-*`
annotations by default. They identify semantic nodes, rich component names,
and JSON-compatible component props without requiring an extra layout wrapper.
`parsePostkitHtml` recognizes those hints, while also remaining useful for
ordinary unannotated RSS or CMS HTML.

Annotations improve round trips, but they are not an authenticity mechanism.
Continue to treat remote content as untrusted and expose only application-
approved component overrides and link behavior.
