import { queryTerms, termsPattern } from './text';

export interface HighlightSegment {
  readonly text: string;
  readonly match: boolean;
}

/**
 * Splits `text` into plain and matched runs for `<mark>`: each query word is matched at the
 * start of a word, case-insensitively ("callout" marks "Callout" in "Callout’s parts").
 */
export function highlightSegments(
  text: string,
  query: string,
): HighlightSegment[] {
  const pattern = termsPattern(queryTerms(query));
  if (!pattern || !text) return text ? [{ text, match: false }] : [];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  pattern.lastIndex = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match[0].length === 0) {
      pattern.lastIndex += 1;
      continue;
    }
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), match: false });
    }
    segments.push({ text: match[0], match: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }
  return segments;
}
