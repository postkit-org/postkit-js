import { slug } from 'github-slugger';
import { isValidElement, type ReactNode } from 'react';

/** One entry in the "On this page" list: the heading's `id` and its plain text. */
export interface TocHeading {
  readonly id: string;
  readonly text: string;
}

/**
 * The `id` for a heading's text, GitHub style: `What's supported` → `whats-supported`.
 * `MdxContent` uses it for rendered `h2`/`h3`s and `extractHeadings` for the TOC, so the
 * two always agree. It's stateless: two `h2`s with the same text on one page get the same
 * id, so keep `h2` text unique within a page (`extractHeadings` warns in development).
 */
export function slugifyHeading(text: string): string {
  return slug(text.trim());
}

/** The plain text of rendered heading children (`["Use ", <code>x</code>]` → `"Use x"`). */
export function headingText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(headingText).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return headingText(node.props.children);
  }
  return '';
}

const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Markdown inline syntax → the text MDX renders: code spans, links, images, emphasis,
 * inline JSX/HTML tags, escapes and entities.
 */
function inlineMarkdownToText(source: string): string {
  // Code spans keep their content verbatim: park them while the rest is unwrapped.
  const codeSpans: string[] = [];
  const parked = source.replace(/(`+)([\s\S]*?)\1/g, (_, __, code: string) => {
    codeSpans.push(code.trim());
    return `\uE000${codeSpans.length - 1}\uE000`;
  });

  return (
    parked
      // Images keep their alt text; links keep their label.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      // Inline JSX and HTML tags.
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      // Emphasis and strikethrough markers (not intra-word underscores).
      .replace(/(\*{1,3}|~~)(?=\S)([\s\S]*?\S)\1/g, '$2')
      .replace(/(^|\W)(_{1,3})(?=\S)([\s\S]*?\S)\2(?=\W|$)/g, '$1$3')
      // Backslash escapes and the common named and numeric entities.
      .replace(/\\([!-/:-@[-`{-~])/g, '$1')
      .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
        if (entity.startsWith('#x') || entity.startsWith('#X')) {
          return String.fromCodePoint(parseInt(entity.slice(2), 16));
        }
        if (entity.startsWith('#')) {
          return String.fromCodePoint(parseInt(entity.slice(1), 10));
        }
        return entities[entity.toLowerCase()] ?? match;
      })
      .replace(/\s+/g, ' ')
      .trim()
      .replace(
        /\uE000(\d+)\uE000/g,
        (_, index: string) => codeSpans[Number(index)],
      )
  );
}

export interface ExtractHeadingsOptions {
  /** The heading depths to return. Defaults to `[2]`: the TOC lists `h2`s only. */
  readonly depths?: readonly number[];
}

/**
 * The headings of a Markdown/MDX body, in order, with the ids `MdxContent` gives them.
 * Run it on the raw source (server side, next to `serialize`) and pass the result to `Toc`.
 *
 * Reads ATX headings (`## Title`) outside fenced code blocks and frontmatter. Setext
 * headings (`Title` over `---`) and headings built in JSX (`<h2>`) aren't read.
 */
export function extractHeadings(
  source: string,
  { depths = [2] }: ExtractHeadingsOptions = {},
): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let fence: string | null = null;
  let index = 0;

  // Skip frontmatter, if the body still has it.
  if (lines[0]?.trim() === '---' || lines[0]?.trim() === '+++') {
    const marker = lines[0].trim();
    const end = lines.findIndex(
      (line, lineIndex) => lineIndex > 0 && line.trim() === marker,
    );
    if (end > 0) index = end + 1;
  }

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);

    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length &&
        line.trim() === fenceMatch[1]
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }

    const heading = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
    if (!heading || !depths.includes(heading[1].length)) continue;

    const text = inlineMarkdownToText(heading[2]);
    const id = slugifyHeading(text);
    if (!id) continue;

    if (
      process.env.NODE_ENV !== 'production' &&
      headings.some((existing) => existing.id === id)
    ) {
      console.warn(
        `[headings] Two headings share the id "${id}" ("${text}"). The TOC links to the first.`,
      );
    }
    headings.push({ id, text });
  }

  return headings;
}
