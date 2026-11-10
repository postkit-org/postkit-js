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
- `PostkitPropsOf`, `PostkitSlotOf`, `PostkitThemeVariantOf`,
  `PostkitThemeKeyOf` and `PostkitRecipeKeyOf` derive view props, slot and
  variant unions, and theme and recipe keys from a definition.
- `postkitBuiltInDefinitions` maps each built-in component name to its
  definition, and each definition is also exported on its own, such as
  `calloutDefinition`.

## License

MIT
