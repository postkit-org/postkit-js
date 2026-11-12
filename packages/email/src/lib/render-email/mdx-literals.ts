import type { EmailWarnings } from './warnings.js';

/*
 * MDX never runs in email: `@postkit/core`'s parser rejects expressions and
 * ESM, and an email has nothing to run them with. Literal values (the common
 * case, `items={[{ "title": "…" }]}` or `{' '}`) are kept as data; anything
 * else is left out with a warning, so a post the site renders never throws.
 */

/** A minimal mdast / MDX node: only the fields this module reads. */
export interface EmailSyntaxNode {
  type: string;
  name?: string | null;
  value?: unknown;
  children?: EmailSyntaxNode[];
  attributes?: EmailSyntaxNode[];
  data?: { estree?: EstreeNode | null; [key: string]: unknown };
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
  [key: string]: unknown;
}

interface EstreeNode {
  type: string;
  [key: string]: unknown;
}

class NotLiteral extends Error {}

function fail(): never {
  throw new NotLiteral();
}

function propertyKey(node: EstreeNode): string {
  const key = node['key'] as EstreeNode;
  if (node['computed']) fail();
  if (key.type === 'Identifier') return key['name'] as string;
  if (key.type === 'Literal' && typeof key['value'] === 'string') {
    return key['value'];
  }
  if (key.type === 'Literal' && typeof key['value'] === 'number') {
    return String(key['value']);
  }
  return fail();
}

/** Evaluates literal data only: no identifiers, calls or spreads. */
function evaluate(node: EstreeNode | null | undefined): unknown {
  if (!node) return fail();
  switch (node.type) {
    case 'Literal': {
      if ('regex' in node || 'bigint' in node) fail();
      return node['value'];
    }
    case 'TemplateLiteral': {
      if ((node['expressions'] as unknown[]).length) fail();
      return (node['quasis'] as EstreeNode[])
        .map((quasi) => (quasi['value'] as { cooked: string }).cooked)
        .join('');
    }
    case 'UnaryExpression': {
      const value = evaluate(node['argument'] as EstreeNode);
      if (typeof value !== 'number') fail();
      if (node['operator'] === '-') return -value;
      if (node['operator'] === '+') return value;
      return fail();
    }
    case 'ArrayExpression':
      return (node['elements'] as (EstreeNode | null)[]).map((element) =>
        element && element.type !== 'SpreadElement'
          ? evaluate(element)
          : fail(),
      );
    case 'ObjectExpression': {
      const result: Record<string, unknown> = {};
      for (const property of node['properties'] as EstreeNode[]) {
        if (
          property.type !== 'Property' ||
          property['kind'] !== 'init' ||
          property['method'] ||
          property['shorthand']
        ) {
          fail();
        }
        const key = propertyKey(property);
        if (['__proto__', 'constructor', 'prototype'].includes(key)) fail();
        result[key] = evaluate(property['value'] as EstreeNode);
      }
      return result;
    }
    case 'Identifier':
      return node['name'] === 'undefined' ? undefined : fail();
    default:
      return fail();
  }
}

type Literal = { readonly value: unknown } | { readonly comment: true };

/** An expression's literal value, `comment` for `{/* … *\/}`, or `undefined`. */
function literalOf(node: EmailSyntaxNode): Literal | undefined {
  const program = node.data?.estree;
  if (!program) return undefined;
  const body = program['body'] as EstreeNode[] | undefined;
  if (!body || body.length === 0) return { comment: true };
  const [statement] = body;
  if (body.length !== 1 || statement?.type !== 'ExpressionStatement') {
    return undefined;
  }
  try {
    return { value: evaluate(statement['expression'] as EstreeNode) };
  } catch (error) {
    if (error instanceof NotLiteral) return undefined;
    throw error;
  }
}

function place(node: EmailSyntaxNode) {
  return node.position
    ? { line: node.position.start.line, column: node.position.start.column }
    : {};
}

/** A literal as a JSX attribute: `true` is bare, `false` and `null` are dropped. */
function attributeValue(value: unknown): { keep: boolean; value: unknown } {
  if (value === true) return { keep: true, value: null };
  if (value === false || value === null || value === undefined) {
    return { keep: false, value: undefined };
  }
  if (typeof value === 'string') return { keep: true, value };
  if (typeof value === 'number') return { keep: true, value: String(value) };
  return { keep: true, value: JSON.stringify(value) };
}

function settleAttributes(node: EmailSyntaxNode, warnings: EmailWarnings) {
  if (!node.attributes) return;
  node.attributes = node.attributes.flatMap((attribute) => {
    if (attribute.type === 'mdxJsxExpressionAttribute') {
      warnings.add({
        code: 'mdx-expression',
        message: `A spread attribute on <${node.name ?? ''}> was left out: MDX code doesn't run in email.`,
        ...(node.name ? { component: node.name } : {}),
        ...place(node),
      });
      return [];
    }
    const value = attribute.value as EmailSyntaxNode | string | null;
    if (
      !value ||
      typeof value !== 'object' ||
      value.type !== 'mdxJsxAttributeValueExpression'
    ) {
      return [attribute];
    }
    const literal = literalOf(value);
    if (literal && 'value' in literal) {
      const settled = attributeValue(literal.value);
      return settled.keep ? [{ ...attribute, value: settled.value }] : [];
    }
    warnings.add({
      code: 'mdx-expression',
      message: `<${node.name ?? ''}> ${attribute.name ?? ''}={…} was left out: only literal values work in email.`,
      ...(node.name ? { component: node.name } : {}),
      ...place(node),
    });
    return [];
  });
}

/**
 * Replaces MDX expressions and ESM in place: literals become text or
 * attribute values, comments disappear, and everything else is removed
 * with a warning.
 */
export function settleMdxExpressions(
  parent: EmailSyntaxNode,
  warnings: EmailWarnings,
): void {
  if (!parent.children) return;
  parent.children = parent.children.flatMap((node): EmailSyntaxNode[] => {
    if (node.type === 'mdxjsEsm') {
      warnings.add({
        code: 'mdx-esm',
        message:
          "An MDX import or export was left out: MDX code doesn't run in email.",
        ...place(node),
      });
      return [];
    }
    if (
      node.type === 'mdxFlowExpression' ||
      node.type === 'mdxTextExpression'
    ) {
      const literal = literalOf(node);
      if (literal && 'comment' in literal) return [];
      if (
        literal &&
        (typeof literal.value === 'string' || typeof literal.value === 'number')
      ) {
        const text: EmailSyntaxNode = {
          type: 'text',
          value: String(literal.value),
        };
        return node.type === 'mdxFlowExpression'
          ? [{ type: 'paragraph', children: [text] }]
          : [text];
      }
      if (literal && (literal.value === undefined || literal.value === null)) {
        return [];
      }
      warnings.add({
        code: 'mdx-expression',
        message:
          "An MDX expression was left out: MDX code doesn't run in email.",
        ...place(node),
      });
      return [];
    }
    if (
      node.type === 'mdxJsxFlowElement' ||
      node.type === 'mdxJsxTextElement'
    ) {
      settleAttributes(node, warnings);
    }
    settleMdxExpressions(node, warnings);
    return [node];
  });
}
