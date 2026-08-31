# @postkit/core

Portable, versioned Postkit documents for moving structured content between
HTML, Markdown, MDX, JSON, and renderers without depending on React.

```ts
import { parsePostkit } from '@postkit/core';

const document = parsePostkit(feedItem.content, { format: 'html' });
```

The HTML and MDX parsers are intentionally non-executable. They preserve safe
semantic content and recognized Postkit annotations while discarding scripts,
event handlers, unsafe URLs, and MDX expressions.

## Formats

- `parsePostkitHtml(source)` normalizes untrusted HTML into semantic nodes.
- `parsePostkitMarkdown(source)` supports CommonMark and GFM.
- `parsePostkit(source, { format: 'mdx' })` supports literal MDX components and
  rejects expressions, spread props, imports, and exports.
- `parsePostkitJson(source)` validates the versioned document format.

Documents use an explicit `version` so future schema changes can be migrated
without guessing which representation a consumer received.

## License

MIT
