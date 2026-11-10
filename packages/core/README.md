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
computed `support`, and each prop's `default` and `themeVariant`.
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
