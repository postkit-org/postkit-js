import type { EmailSyntaxNode } from './mdx-literals.js';

/*
 * Footnotes in email are always end notes (03 §7.1): a superscript number in
 * the text, without a link (in-message anchors are unreliable across mail
 * clients), and the notes in a numbered list that closes the message.
 *
 * There is one path for them. The site's `remarkPostkit` numbers GFM
 * `[^id]`, `:footnote[…]` and `<Footnote>…</Footnote>` and writes one
 * `Footnotes` list; `@postkit/core` reads those as footnote nodes; the
 * renderer draws the nodes with the email `Footnote` and `Footnotes` views
 * (`postkitEmailFootnoteComponents`), the list always at the end.
 *
 * The site fails a build on a reference with no definition. An email never
 * throws on content, so such a reference stays the text the author wrote.
 */

/** The `remarkPostkit` footnote rules, reported as the `footnote` code. */
const footnoteRules = new Set([
  'duplicate-footnote',
  'duplicate-footnotes',
  'missing-footnote',
  'unreferenced-footnote',
]);

/** The warning code for a `remarkPostkit` rule id. */
export function emailWarningCode(ruleId: string | undefined): string {
  if (ruleId && footnoteRules.has(ruleId)) return 'footnote';
  return ruleId ?? 'validation';
}

/** Content the footnote transform doesn't read. */
const skipped = new Set([
  'code',
  'inlineCode',
  'html',
  'mdxjsEsm',
  'mdxFlowExpression',
  'mdxTextExpression',
  'yaml',
  'toml',
]);

/** `[^id]` the author didn't escape. */
const dangling = /(?<!\\)\[(?=\^[^\]\s]+\])/g;

/**
 * Splits the text of a reference GFM didn't link (it has no definition) after
 * its `[`, so the footnote transform sees text rather than a reference it
 * would fail on. The pieces have no position: the transform reads a text
 * node's source when it has one. Markdown output escapes the `[`, so the
 * author's `[^id]` reaches the email as text.
 */
function keepDanglingReferences(parent: EmailSyntaxNode): void {
  if (!parent.children) return;
  parent.children = parent.children.flatMap((node): EmailSyntaxNode[] => {
    if (skipped.has(node.type)) return [node];
    if (node.type !== 'text' || typeof node.value !== 'string') {
      keepDanglingReferences(node);
      return [node];
    }
    const value = node.value;
    const cuts = [...value.matchAll(dangling)].map(
      (match) => (match.index ?? 0) + 1,
    );
    if (cuts.length === 0) return [node];
    return [0, ...cuts].map((start, index) => ({
      type: 'text',
      value: value.slice(start, cuts[index] ?? value.length),
    }));
  });
}

/**
 * A Remark plugin for the email parse, before `remarkPostkit`: footnote
 * references with no definition stay as their text.
 */
export function emailDanglingFootnotes() {
  return (tree: EmailSyntaxNode): void => keepDanglingReferences(tree);
}
