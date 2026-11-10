import {
  createPostkitDocument,
  type PostkitDocument,
  type PostkitNode,
} from '@postkit/core';

import { EMAIL_FOOTNOTE_ATTRIBUTE } from './end-notes.js';
import { planEmailComponent, type EmailRenderContext } from './plan.js';

function toTextNodes(
  nodes: readonly PostkitNode[],
  context: EmailRenderContext,
): PostkitNode[] {
  return nodes.flatMap((node): PostkitNode[] => {
    if (node.type === 'text') return [node];
    if (node.type === 'element') {
      const number = node.attributes?.[EMAIL_FOOTNOTE_ATTRIBUTE];
      if (node.name === 'sup' && number !== undefined) {
        return [{ type: 'text', value: `[${String(number)}]` }];
      }
      return [{ ...node, children: toTextNodes(node.children, context) }];
    }
    const plan = planEmailComponent(node, context);
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

/**
 * The document the plain-text part is written from: the same decisions as
 * the HTML (omitted components left out, `link` fallbacks as links), with
 * footnote marks as `[1]`. Core's text serializer does the rest.
 */
export function toEmailTextDocument(
  document: PostkitDocument,
  context: EmailRenderContext,
): PostkitDocument {
  return createPostkitDocument(toTextNodes(document.children, context));
}
