/**
 * Markdown/MDX → searchable plain text. Search needs what a reader sees, not the markup:
 * code fences, MDX comments, imports, directive fences and JSX tags are dropped; links,
 * emphasis and code spans keep their text. Each block (paragraph, list item, table row)
 * becomes one line, so snippets can be cut from whole sentences.
 */

const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Inline Markdown → its rendered text: `[a](b)` → `a`, `` `x` `` → `x`, `**y**` → `y`. */
export function inlineMarkdownToText(source: string): string {
  return (
    source
      // Footnote references.
      .replace(/\[\^[^\]]+\]/g, '')
      // Images keep their alt text; links keep their label.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      // Code spans keep their content.
      .replace(/(`+)([\s\S]*?)\1/g, (_, __, code: string) => code.trim())
      // Inline JSX and HTML tags.
      .replace(/<\/?[A-Za-z][^>]*>/g, '')
      // Emphasis and strikethrough markers (not intra-word underscores).
      .replace(/(\*{1,3}|~~)(?=\S)([\s\S]*?\S)\1/g, '$2')
      .replace(/(^|\W)(_{1,3})(?=\S)([\s\S]*?\S)\2(?=\W|$)/g, '$1$3')
      // Backslash escapes and entities.
      .replace(/\\([!-/:-@[-`{-~])/g, '$1')
      .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
        if (/^#x/i.test(entity)) {
          return String.fromCodePoint(parseInt(entity.slice(2), 16));
        }
        if (entity.startsWith('#')) {
          return String.fromCodePoint(parseInt(entity.slice(1), 10));
        }
        return entities[entity.toLowerCase()] ?? match;
      })
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Block Markdown/MDX → plain text, one line per block. */
export function markdownToText(source: string): string {
  const withoutBlocks = source
    .replace(/\r\n?/g, '\n')
    // MDX and HTML comments.
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Fenced code: what a reader copies, not what they search for.
    .replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\2[ \t]*$/gm, '')
    // Self-closing JSX blocks (`<KeyTakeaway items='…' />`), which may span lines.
    .replace(/<[A-Z][\w.]*(?:\s[^<>]*?)?\/>/g, '');

  const lines: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const text = inlineMarkdownToText(paragraph.join(' '));
    if (text) lines.push(text);
    paragraph = [];
  };

  for (const rawLine of withoutBlocks.split('\n')) {
    const line = rawLine.trim();

    if (
      !line ||
      /^(import|export)\s/.test(line) ||
      // Container and leaf directive fences (`:::postkit-callout{…}`, `:::`).
      /^:{2,}/.test(line) ||
      // Table separator rows and thematic breaks.
      /^\|?\s*:?-{3,}/.test(line) ||
      /^([-*_])(\s*\1){2,}$/.test(line)
    ) {
      flush();
      continue;
    }

    // JSX/HTML block tags on their own line keep no text of their own.
    if (/^<\/?[A-Za-z][^>]*>$/.test(line)) {
      flush();
      continue;
    }

    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      paragraph.push(heading[1].replace(/\s#+$/, ''));
      flush();
      continue;
    }

    if (line.startsWith('|')) {
      flush();
      paragraph.push(
        line
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(' · '),
      );
      flush();
      continue;
    }

    const listItem = /^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.*)$/.exec(line);
    if (listItem) {
      flush();
      paragraph.push(listItem[1]);
      continue;
    }

    paragraph.push(line.replace(/^>\s?/, '').replace(/^\[\^[^\]]+\]:\s*/, ''));
  }
  flush();

  return lines.join('\n');
}

export interface MarkdownSection {
  /** The `h2`'s plain text, or `null` for the text before the first `h2`. */
  readonly heading: string | null;
  /** The section's Markdown, without its heading line. */
  readonly body: string;
}

/** Splits Markdown at its `h2`s, ignoring `##` inside code fences. */
export function splitMarkdownSections(source: string): MarkdownSection[] {
  const sections: { heading: string | null; lines: string[] }[] = [
    { heading: null, lines: [] },
  ];
  let fence: string | null = null;

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1];
      else if (fenceMatch[1].startsWith(fence)) fence = null;
    }

    const heading = fence === null ? /^##\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (heading) {
      sections.push({ heading: inlineMarkdownToText(heading[1]), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  return sections.map(({ heading, lines }) => ({
    heading,
    body: lines.join('\n').trim(),
  }));
}

/** The text's first sentence, for a section's description. */
export function firstSentence(
  text: string,
  maxLength = 160,
): string | undefined {
  const sentence = splitSentences(text)[0];
  return sentence ? truncate(sentence, 0, maxLength) : undefined;
}

export function splitSentences(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?…])\s+(?=[^\s])/u))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// --- Query terms and snippets ----------------------------------------------------------

const wordBoundary = '(?<![\\p{L}\\p{N}])';

/** The query's words worth highlighting: lowercase, two characters or more, de-duplicated. */
export function queryTerms(query: string): string[] {
  const terms = query
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}@#+]+/u)
    .filter((term) => term.length >= 2);
  // Longest first, so `callouts` is matched before `call`.
  return [...new Set(terms)].sort((left, right) => right.length - left.length);
}

/** Matches any term at the start of a word, case-insensitively. `null` for no terms. */
export function termsPattern(terms: readonly string[]): RegExp | null {
  if (terms.length === 0) return null;
  const escaped = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return new RegExp(`${wordBoundary}(?:${escaped.join('|')})`, 'giu');
}

function truncate(
  sentence: string,
  matchIndex: number,
  maxLength: number,
): string {
  if (sentence.length <= maxLength) return sentence;

  // Keep the match in view: start a little before it, on a word boundary.
  let start = Math.max(0, matchIndex - 32);
  if (start > 0) {
    const space = sentence.lastIndexOf(' ', start);
    start = space > 0 ? space + 1 : 0;
  }
  let end = Math.min(sentence.length, start + maxLength);
  if (end < sentence.length) {
    const space = sentence.lastIndexOf(' ', end);
    if (space > start) end = space;
  }

  return `${start > 0 ? '…' : ''}${sentence.slice(start, end).trim()}${
    end < sentence.length ? '…' : ''
  }`;
}

export interface SnippetSource {
  readonly title: string;
  readonly description?: string;
  readonly text: string;
}

/**
 * The line shown under a result: the first sentence that contains a query term, cut to
 * `maxLength` around the match. A title match shows the description, as on the boards
 * ("Callout · A highlighted note, tip, warning, or caution.").
 */
export function createSnippet(
  source: SnippetSource,
  query: string,
  maxLength = 160,
): string | undefined {
  const pattern = termsPattern(queryTerms(query));
  const fallback = source.description ?? firstSentence(source.text, maxLength);
  if (!pattern) return fallback;

  const matches = (value: string) => {
    pattern.lastIndex = 0;
    const match = pattern.exec(value);
    return match ? match.index : -1;
  };

  if (source.description && matches(source.title) >= 0) {
    return source.description;
  }

  const candidates = [
    ...(source.description ? [source.description] : []),
    ...splitSentences(source.text),
  ];
  for (const sentence of candidates) {
    const index = matches(sentence);
    if (index >= 0) return truncate(sentence, index, maxLength);
  }

  return fallback;
}
