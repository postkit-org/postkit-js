import {
  createPostkitDocument,
  parsePostkit,
  resolvePostkitFootnotes,
  type PostkitDocument,
} from '@postkit/core';
import {
  postkitBuiltInDefinitions,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';
import { createPostkitRemarkPlugins } from '@postkit/react/remark';
import { directiveToMarkdown } from 'mdast-util-directive';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mdxToMarkdown } from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';

import { emailDanglingFootnotes, emailWarningCode } from './end-notes.js';
import { settleMdxExpressions, type EmailSyntaxNode } from './mdx-literals.js';
import { EmailWarnings, type RenderEmailWarning } from './warnings.js';

/** What `renderEmail` reads: Markdown, MDX, or a `@postkit/core` document. */
export type RenderEmailFormat = 'document' | 'markdown' | 'mdx';

export interface ParseEmailSourceOptions {
  /**
   * `markdown` (the default for a string), `mdx`, or `document` (a
   * `@postkit/core` document, or its JSON; the default for an object).
   */
  readonly format?: RenderEmailFormat;
  /**
   * The components the source may use. Defaults to every built-in
   * definition; pass `createPostkit().definitions` (plus your own) to check
   * against exactly the site's set.
   */
  readonly definitions?: readonly AnyPostkitComponentDefinition[];
  /** Extra component names the host renders, such as site-only components. */
  readonly components?: readonly string[];
}

export interface ParsedEmailSource {
  readonly document: PostkitDocument;
  readonly warnings: readonly RenderEmailWarning[];
  /**
   * Whether the document has footnotes (GFM `[^id]`, `:footnote[…]` or
   * `<Footnote>`), which the email ends with.
   */
  readonly footnotes: boolean;
}

const builtInDefinitions: readonly AnyPostkitComponentDefinition[] =
  Object.values(postkitBuiltInDefinitions);

/** Frontmatter is the host's data, not content. */
function dropFrontmatter(root: EmailSyntaxNode): void {
  root.children = (root.children ?? []).filter(
    (node) => node.type !== 'yaml' && node.type !== 'toml',
  );
}

/**
 * Drops HTML comments, which plain Markdown allows and MDX doesn't, so the
 * MDX bridge below can read the tree.
 */
function dropHtmlComments(parent: EmailSyntaxNode): void {
  if (!parent.children) return;
  parent.children = parent.children.filter((node) => {
    if (node.type === 'html') {
      return !/^\s*<!--[\s\S]*?-->\s*$/.test(String(node.value ?? ''));
    }
    dropHtmlComments(node);
    return true;
  });
}

function plainDocument(source: string): PostkitDocument {
  return createPostkitDocument(
    source.trim()
      ? [
          {
            type: 'element',
            name: 'p',
            children: [{ type: 'text', value: source.trim() }],
          },
        ]
      : [],
  );
}

/**
 * Reads a Markdown or MDX source the way the site does: the same Remark
 * preset and `remarkPostkit` validation, against the same definitions. It
 * reports instead of failing on anything the site would only warn about
 * (unknown components, MDX code), keeps a footnote reference with no
 * definition as its text, then hands the tree to `@postkit/core`'s safe MDX
 * parser, so directives become components and footnotes footnote nodes.
 */
function parseMarkdownSource(
  source: string,
  mdx: boolean,
  options: ParseEmailSourceOptions,
  warnings: EmailWarnings,
): PostkitDocument {
  const file = new VFile({ value: source });
  const processor = unified().use(remarkParse);
  if (mdx) processor.use(remarkMdx);
  processor.use(emailDanglingFootnotes);
  processor.use(
    createPostkitRemarkPlugins({
      postkit: {
        definitions: options.definitions ?? builtInDefinitions,
        components: options.components ?? [],
        // Unknown components are reported (and kept as their content)
        // rather than failing; invalid props still fail, as on the site.
        strict: false,
      },
    }),
  );
  const tree = processor.runSync(
    processor.parse(file),
    file,
  ) as unknown as EmailSyntaxNode;

  for (const message of file.messages) {
    // The renderer reports unknown components itself, with what it did.
    if (message.ruleId === 'unknown-component') continue;
    warnings.add({
      code: emailWarningCode(message.ruleId ?? undefined),
      message: message.reason,
      ...(typeof message.line === 'number' ? { line: message.line } : {}),
      ...(typeof message.column === 'number' ? { column: message.column } : {}),
    });
  }

  dropFrontmatter(tree);
  if (!mdx) dropHtmlComments(tree);
  settleMdxExpressions(tree, warnings);

  try {
    const bridge = toMarkdown(tree as Parameters<typeof toMarkdown>[0], {
      extensions: [gfmToMarkdown(), mdxToMarkdown(), directiveToMarkdown()],
    });
    return parsePostkit(bridge, {
      format: 'mdx',
      markdown: { missingFootnotes: 'literal' },
    });
  } catch (error) {
    warnings.add({
      code: 'parse',
      message: `The source was read as plain Markdown, without components: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
  try {
    return parsePostkit(source, {
      format: 'markdown',
      markdown: { missingFootnotes: 'literal' },
    });
  } catch {
    return plainDocument(source);
  }
}

/**
 * Parses an email's source into a `@postkit/core` document, with the
 * site's validation (03 §6.1). `renderEmail` calls this first; call it
 * yourself to pick parts of a post, as the release email does, then render
 * the result with `format: 'document'`.
 */
export function parseEmailSource(
  source: string | PostkitDocument,
  options: ParseEmailSourceOptions = {},
): ParsedEmailSource {
  const warnings = new EmailWarnings();
  const format: RenderEmailFormat =
    options.format ?? (typeof source === 'string' ? 'markdown' : 'document');
  if (format !== 'document' && typeof source !== 'string') {
    throw new TypeError(`renderEmail: ${format} source must be a string.`);
  }
  const document =
    format === 'document'
      ? parsePostkit(source, { format: 'json' })
      : parseMarkdownSource(
          source as string,
          format === 'mdx',
          options,
          warnings,
        );
  return {
    document,
    warnings: warnings.list,
    footnotes: resolvePostkitFootnotes(document).notes.length > 0,
  };
}
