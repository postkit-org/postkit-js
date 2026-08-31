import type { PostkitDocument } from './document.js';
import {
  parsePostkitHtml,
  type ParsePostkitHtmlOptions,
} from './parse-html.js';
import { parsePostkitJson } from './parse-json.js';
import {
  parsePostkitMarkdown,
  type ParsePostkitMarkdownOptions,
} from './parse-markdown.js';
import { PostkitParseError } from './parse-error.js';

export type PostkitInputFormat = 'html' | 'json' | 'markdown' | 'mdx';

export interface ParsePostkitOptions {
  readonly format: PostkitInputFormat;
  readonly html?: ParsePostkitHtmlOptions;
  readonly markdown?: ParsePostkitMarkdownOptions;
}

export function parsePostkit(
  source: string | unknown,
  options: ParsePostkitOptions,
): PostkitDocument {
  switch (options.format) {
    case 'html':
      if (typeof source !== 'string') {
        throw new PostkitParseError(
          'invalid-document',
          'HTML input must be a string.',
        );
      }
      return parsePostkitHtml(source, options.html);
    case 'markdown':
    case 'mdx':
      if (typeof source !== 'string') {
        throw new PostkitParseError(
          'invalid-document',
          'Markdown and MDX input must be strings.',
        );
      }
      return parsePostkitMarkdown(source, {
        ...options.markdown,
        mdx: options.format === 'mdx',
      });
    case 'json':
      return parsePostkitJson(source);
    default:
      throw new PostkitParseError(
        'unsupported-format',
        `Unsupported Postkit input format: ${String(options.format)}.`,
      );
  }
}

export { PostkitParseError } from './parse-error.js';
