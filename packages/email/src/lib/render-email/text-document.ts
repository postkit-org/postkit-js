import {
  createPostkitDocument,
  normalizePostkitFootnoteIdentifier,
  resolvePostkitFootnotes,
  type PostkitDocument,
  type PostkitFootnoteResolution,
  type PostkitNode,
} from '@postkit/core';

import {
  postkitEmailFootnoteMark,
  type PostkitEmailFootnoteNumbering,
} from '../footnotes.js';
import { planEmailComponent, type EmailRenderContext } from './plan.js';

interface TextContext {
  readonly render: EmailRenderContext;
  readonly footnotes: PostkitFootnoteResolution;
  readonly numbering: PostkitEmailFootnoteNumbering | undefined;
}

function toTextNodes(
  nodes: readonly PostkitNode[],
  context: TextContext,
): PostkitNode[] {
  return nodes.flatMap((node): PostkitNode[] => {
    if (node.type === 'text') return [node];
    if (node.type === 'footnoteDefinition') return [];
    if (node.type === 'footnoteReference') {
      const note = context.footnotes.byIdentifier.get(
        normalizePostkitFootnoteIdentifier(node.identifier),
      );
      return [
        {
          type: 'text',
          value: note?.definition
            ? `[${postkitEmailFootnoteMark(note.index, context.numbering)}]`
            : `[^${node.label ?? node.identifier}]`,
        },
      ];
    }
    if (node.type === 'element') {
      return [{ ...node, children: toTextNodes(node.children, context) }];
    }
    // The notes are listed at the end, as in the HTML part.
    if (node.name === 'Footnotes' && context.footnotes.notes.length) return [];
    const plan = planEmailComponent(node, context.render);
    if (plan.kind === 'fallback' && plan.fallback === 'omit') return [];
    if (plan.kind === 'fallback' && plan.fallback === 'link') {
      return [
        {
          type: 'element',
          name: 'p',
          children: [
            {
              type: 'element',
              name: 'a',
              attributes: { href: plan.href ?? '' },
              children: [{ type: 'text', value: plan.label ?? '' }],
            },
          ],
        },
      ];
    }
    return [{ ...node, children: toTextNodes(node.children, context) }];
  });
}

/** The end notes: a `Notes` heading and the numbered notes. */
function endNotes(context: TextContext): PostkitNode[] {
  const notes = context.footnotes.notes.filter((note) => note.definition);
  if (notes.length === 0) return [];
  const title = context.footnotes.list?.props?.['title'];
  const heading =
    title === false || String(title) === 'false'
      ? undefined
      : typeof title === 'string' && title.trim()
        ? title
        : 'Notes';
  return [
    ...(heading
      ? [
          {
            type: 'element',
            name: 'p',
            children: [{ type: 'text', value: heading }],
          } satisfies PostkitNode,
        ]
      : []),
    {
      type: 'element',
      name: 'ol',
      children: notes.map((note): PostkitNode => ({
        type: 'element',
        name: 'li',
        children: toTextNodes(note.definition?.children ?? [], context),
      })),
    },
  ];
}

/**
 * The document the plain-text part is written from: the same decisions as
 * the HTML (omitted components left out, `link` fallbacks as links), with
 * footnote marks as `[1]` and the notes listed at the end. Core's text
 * serializer does the rest.
 */
export function toEmailTextDocument(
  document: PostkitDocument,
  context: EmailRenderContext,
): PostkitDocument {
  const footnotes = resolvePostkitFootnotes(document);
  const numbering = footnotes.list?.props?.['numbering'];
  const text: TextContext = {
    render: context,
    footnotes,
    numbering:
      typeof numbering === 'string'
        ? (numbering as PostkitEmailFootnoteNumbering)
        : undefined,
  };
  return createPostkitDocument([
    ...toTextNodes(document.children, text),
    ...endNotes(text),
  ]);
}
