import {
  createPostkitDocument,
  parsePostkit,
  serializePostkitHtml,
  type PostkitAttributeValue,
  type PostkitDocument,
  type PostkitNode,
} from '@postkit/core';
import { createPostkitRemarkPlugins } from '@postkit/chakra/remark';
import { directiveToMarkdown } from 'mdast-util-directive';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mdxToMarkdown } from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

export type FeedSourceFormat = 'markdown' | 'mdx';

/**
 * A feed item's body. `full` is the whole entry; `summary` is the fallback (the summary and a
 * link) used when the entry has content `@postkit/core` can't serialize to HTML yet.
 */
export type FeedContent =
  | { readonly kind: 'full'; readonly html: string }
  | {
      readonly kind: 'summary';
      readonly html: string;
      /** Why the full body was left out, for the build log. */
      readonly reason: string;
    };

export interface RenderFeedContentOptions {
  readonly format: FeedSourceFormat;
  /** The canonical origin (`https://postkit.org`): relative links resolve against it. */
  readonly siteUrl: string;
  /** The item's absolute URL, for the fallback's "Read on postkit.org" link. */
  readonly url: string;
  readonly title: string;
  readonly summary: string;
}

function textOf(nodes: readonly PostkitNode[]): string {
  return nodes
    .map((node) => (node.type === 'text' ? node.value : textOf(node.children)))
    .join('');
}

/** Drops a leading `# Title` that repeats the item title: feed readers show the title already. */
function withoutRepeatedTitle(
  document: PostkitDocument,
  title: string,
): PostkitDocument {
  const [first, ...rest] = document.children;
  return first?.type === 'element' &&
    first.name === 'h1' &&
    textOf(first.children).trim() === title.trim()
    ? createPostkitDocument(rest)
    : document;
}

/**
 * MDX comments (`{/* TODO … *\/}`) are notes for maintainers, not reader content, and the
 * safe core parser rejects them as expressions. Fenced code is left alone. Mirrors
 * `stripMdxComments` in tools/generate-agent-docs.mjs.
 */
export function stripMdxComments(markdown: string): string {
  return markdown
    .split(/(^```[\s\S]*?^```[ \t]*$)/m)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part
            .replace(/^[ \t]*\{\/\*[\s\S]*?\*\/\}[ \t]*\n?/gm, '')
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, ''),
    )
    .join('');
}

/**
 * Turns an entry body into literal MDX: Postkit directives (`:::postkit-callout`) become
 * component tags through the same remark preset the site renders with. `@postkit/core`
 * parses MDX tags but not directives, so this is the bridge between the two.
 */
export function toPostkitMdx(source: string, format: FeedSourceFormat): string {
  const processor = unified().use(remarkParse);
  if (format === 'mdx') processor.use(remarkMdx);
  processor.use(createPostkitRemarkPlugins());
  const tree = processor.runSync(processor.parse(source)) as Parameters<
    typeof toMarkdown
  >[0];
  return toMarkdown(tree, {
    extensions: [gfmToMarkdown(), mdxToMarkdown(), directiveToMarkdown()],
  });
}

const urlAttributes = new Set(['href', 'src', 'poster', 'cite']);

function absolutize(value: PostkitAttributeValue, siteUrl: string) {
  if (typeof value !== 'string') return value;
  return value.startsWith('/') && !value.startsWith('//')
    ? `${siteUrl}${value}`
    : value;
}

/** Root-relative links and media (`/docs/mdx`) become absolute: feed readers have no base URL. */
export function absolutizeDocument(
  document: PostkitDocument,
  siteUrl: string,
): PostkitDocument {
  const visit = (node: PostkitNode): PostkitNode => {
    if (node.type === 'text') return node;
    if (node.type === 'component') {
      return { ...node, children: node.children.map(visit) };
    }
    return {
      ...node,
      ...(node.attributes
        ? {
            attributes: Object.fromEntries(
              Object.entries(node.attributes).map(([name, value]) => [
                name,
                urlAttributes.has(name.toLowerCase())
                  ? absolutize(value, siteUrl)
                  : value,
              ]),
            ),
          }
        : {}),
      children: node.children.map(visit),
    };
  };
  return createPostkitDocument(document.children.map(visit));
}

/**
 * Components whose content lives only in props (`<KeyTakeaway items='[…]' />`). Core's HTML
 * serializer keeps their props in `data-postkit-props` but renders no visible markup for them,
 * so a feed reader would show nothing where they stand.
 */
export function findPropOnlyComponents(document: PostkitDocument): string[] {
  const found = new Set<string>();
  const visit = (node: PostkitNode) => {
    if (node.type === 'text') return;
    if (node.type === 'component' && node.children.length === 0) {
      found.add(node.name);
    }
    node.children.forEach(visit);
  };
  document.children.forEach(visit);
  return [...found];
}

function summaryHtml(options: RenderFeedContentOptions): string {
  return serializePostkitHtml(
    createPostkitDocument([
      {
        type: 'element',
        name: 'p',
        children: [{ type: 'text', value: options.summary }],
      },
      {
        type: 'element',
        name: 'p',
        children: [
          {
            type: 'element',
            name: 'a',
            attributes: { href: options.url },
            children: [{ type: 'text', value: 'Read it on postkit.org' }],
          },
        ],
      },
    ]),
    { annotations: false },
  );
}

/**
 * Renders an entry body to plain, safe HTML through `@postkit/core` (01 §10): the body is
 * parsed by core's non-executable MDX parser and written by its HTML serializer, which keeps
 * Postkit components as annotated elements (`data-postkit-component`) that Postkit-aware
 * readers can rebuild. Entries with prop-only components fall back to the summary and a link.
 */
export function renderFeedContent(
  source: string,
  options: RenderFeedContentOptions,
): FeedContent {
  const body = options.format === 'mdx' ? stripMdxComments(source) : source;
  const document = withoutRepeatedTitle(
    absolutizeDocument(
      parsePostkit(toPostkitMdx(body, options.format), { format: 'mdx' }),
      options.siteUrl,
    ),
    options.title,
  );
  const propOnly = findPropOnlyComponents(document);
  if (propOnly.length > 0) {
    return {
      kind: 'summary',
      html: summaryHtml(options),
      reason: `@postkit/core's HTML serializer renders no markup for prop-only components: ${propOnly.join(', ')}`,
    };
  }
  return { kind: 'full', html: serializePostkitHtml(document) };
}
