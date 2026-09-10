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
  autolinks, and strikethrough. Footnote references and definitions are preserved
  as literal text, not converted into linked footnotes.
- `parsePostkit(source, { format: 'mdx' })` supports literal MDX components and
  rejects expressions, spread props, imports, and exports.
- `parsePostkitJson(source)` validates the versioned document format.
- `serializePostkit(document, { format })` writes HTML, Markdown, MDX, or JSON.

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

MDX serialization escapes literal braces and ESM-like text, keeps code fences
isolated, and validates the generated syntax with the non-executable parser.
Unrepresentable or executable output fails closed rather than returning unsafe
MDX for a downstream compiler.

Documents use an explicit `version` so future schema changes can be migrated
without guessing which representation a consumer received.

Parsing makes content non-executable, but an application still controls the
component registry used to render component nodes and should expose only
components appropriate for its trust boundary.

## License

MIT
