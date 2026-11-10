import {
  createPostkitDocument,
  parsePostkit,
  serializePostkitHtml,
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

export interface RenderFeedContentOptions {
  readonly format: FeedSourceFormat;
  /** The canonical origin (`https://postkit.org`): relative links resolve against it. */
  readonly siteUrl: string;
  readonly title: string;
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

/**
 * Renders an entry body to plain, safe HTML through `@postkit/core` (01 §10): the body is
 * parsed by core's non-executable MDX parser and written by its HTML serializer. Every
 * Postkit component becomes its static view, readable markup with the component's text
 * (titles, items, captions), annotated so Postkit-aware readers can rebuild it. Relative
 * links become absolute, since feed readers have no base URL. The feeds are public, so an
 * AudienceBoundary shows its fallback, and a NewsletterSignup links to the subscribe page.
 */
export function renderFeedContent(
  source: string,
  options: RenderFeedContentOptions,
): string {
  const body = options.format === 'mdx' ? stripMdxComments(source) : source;
  const document = withoutRepeatedTitle(
    parsePostkit(toPostkitMdx(body, options.format), { format: 'mdx' }),
    options.title,
  );
  return serializePostkitHtml(document, {
    baseUrl: options.siteUrl,
    audiences: [],
    newsletterUrl: `${options.siteUrl}/newsletter/subscribe`,
  });
}
