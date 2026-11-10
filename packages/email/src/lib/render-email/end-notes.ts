import type { EmailSyntaxNode } from './mdx-literals.js';
import type { EmailWarnings } from './warnings.js';

/*
 * Footnotes in email are always end notes (03 §7.1): a superscript number in
 * the text, without a link (in-message anchors are unreliable across mail
 * clients), and the notes in a numbered list that closes the message.
 * Numbers follow the order of first reference; source labels are ids.
 *
 * This works on GFM footnotes (`[^id]` and `[^id]: …`) in the Markdown tree,
 * before `@postkit/core` reads it. When the tree has none, it does nothing.
 */

/** The attribute on a reference's `<sup>`: its note number. */
export const EMAIL_FOOTNOTE_ATTRIBUTE = 'data-footnote';
/** The boolean attribute on the closing notes section. */
export const EMAIL_FOOTNOTES_ATTRIBUTE = 'data-footnotes';

function isReference(node: EmailSyntaxNode): boolean {
  return node.type === 'footnoteReference';
}

function isDefinition(node: EmailSyntaxNode): boolean {
  return node.type === 'footnoteDefinition';
}

function identifierOf(node: EmailSyntaxNode): string {
  return String(node['identifier'] ?? node['label'] ?? '');
}

function labelOf(node: EmailSyntaxNode): string {
  return String(node['label'] ?? node['identifier'] ?? '');
}

function place(node: EmailSyntaxNode) {
  return node.position
    ? { line: node.position.start.line, column: node.position.start.column }
    : {};
}

/** Removes every definition from the tree, keeping the first per id. */
function takeDefinitions(
  parent: EmailSyntaxNode,
  definitions: Map<string, EmailSyntaxNode>,
): void {
  if (!parent.children) return;
  parent.children = parent.children.filter((child) => {
    if (isDefinition(child)) {
      const id = identifierOf(child);
      if (!definitions.has(id)) definitions.set(id, child);
      return false;
    }
    takeDefinitions(child, definitions);
    return true;
  });
}

function hasReference(node: EmailSyntaxNode): boolean {
  return isReference(node) || (node.children ?? []).some(hasReference);
}

function superscript(number: number): EmailSyntaxNode {
  return {
    type: 'mdxJsxTextElement',
    name: 'sup',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: EMAIL_FOOTNOTE_ATTRIBUTE,
        value: String(number),
      },
    ],
    children: [{ type: 'text', value: String(number) }],
  };
}

/**
 * Moves GFM footnotes to the end of the tree as end notes, in place. Returns
 * whether there were any.
 */
export function moveFootnotesToEnd(
  root: EmailSyntaxNode,
  warnings: EmailWarnings,
): boolean {
  const definitions = new Map<string, EmailSyntaxNode>();
  takeDefinitions(root, definitions);
  if (definitions.size === 0 && !hasReference(root)) return false;

  const numbers = new Map<string, number>();
  const replace = (parent: EmailSyntaxNode) => {
    if (!parent.children) return;
    parent.children = parent.children.map((child) => {
      if (!isReference(child)) {
        replace(child);
        return child;
      }
      const id = identifierOf(child);
      if (!definitions.has(id)) {
        warnings.add({
          code: 'footnote',
          message: `Footnote [^${labelOf(child)}] has no note, so it stays as text.`,
          ...place(child),
        });
        return { type: 'text', value: `[^${labelOf(child)}]` };
      }
      let number = numbers.get(id);
      if (number === undefined) {
        number = numbers.size + 1;
        numbers.set(id, number);
      }
      return superscript(number);
    });
  };
  replace(root);

  for (const [id, definition] of definitions) {
    if (!numbers.has(id)) {
      warnings.add({
        code: 'footnote',
        message: `Footnote [^${labelOf(definition)}] is never referenced, so it was left out.`,
        ...place(definition),
      });
    }
  }
  if (numbers.size === 0) return false;

  const items = [...numbers.keys()].map((id): EmailSyntaxNode => ({
    type: 'listItem',
    spread: false,
    children: (definitions.get(id)?.children ?? []).map((child) => {
      replace(child);
      return child;
    }),
  }));
  root.children = [
    ...(root.children ?? []),
    {
      type: 'mdxJsxFlowElement',
      name: 'section',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: EMAIL_FOOTNOTES_ATTRIBUTE,
          value: null,
        },
      ],
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'strong', children: [{ type: 'text', value: 'Notes' }] },
          ],
        },
        {
          type: 'list',
          ordered: true,
          start: 1,
          spread: false,
          children: items,
        },
      ],
    },
  ];
  return true;
}
