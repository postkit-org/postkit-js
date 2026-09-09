import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { gfm } from 'micromark-extension-gfm';
import { mdxjs } from 'micromark-extension-mdxjs';
import { raw } from 'hast-util-raw';
import type { Nodes as HastNode, RootContent } from 'hast';

import {
  createPostkitDocument,
  type PostkitAttributeValue,
  type PostkitDocument,
  type PostkitJsonValue,
  type PostkitNode,
} from './document.js';
import { PostkitParseError } from './parse-error.js';
import { normalizePostkitHtmlTree, parsePostkitHtml } from './parse-html.js';

export interface ParsePostkitMarkdownOptions {
  /** Parse MDX component syntax while continuing to reject executable expressions. */
  readonly mdx?: boolean;
  /** Allow only the component names accepted by this predicate. */
  readonly allowComponent?: (name: string) => boolean;
}

interface SyntaxNode {
  readonly type: string;
  readonly identifier?: string;
  readonly children?: readonly SyntaxNode[];
  readonly value?: string;
  readonly depth?: number;
  readonly lang?: string | null;
  readonly meta?: string | null;
  readonly url?: string;
  readonly title?: string | null;
  readonly alt?: string | null;
  readonly ordered?: boolean;
  readonly start?: number | null;
  readonly spread?: boolean;
  readonly checked?: boolean | null;
  readonly align?: readonly (string | null)[];
  readonly name?: string | null;
  readonly attributes?: readonly MdxAttribute[];
}

interface ConversionOptions extends ParsePostkitMarkdownOptions {
  readonly definitions: ReadonlyMap<string, SyntaxNode>;
}

interface MdxAttribute {
  readonly type: string;
  readonly name?: string;
  readonly value?:
    string | null | { readonly type: string; readonly value?: string };
}

function isPostkitJsonValue(value: unknown): value is PostkitJsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isPostkitJsonValue);
  if (typeof value !== 'object') return false;
  return Object.values(value).every(isPostkitJsonValue);
}

function safePropName(name: string): boolean {
  return !['__proto__', 'constructor', 'prototype'].includes(name);
}

function element(
  name: string,
  children: readonly PostkitNode[],
  attributes?: Readonly<Record<string, PostkitAttributeValue>>,
): PostkitNode {
  return {
    type: 'element',
    name,
    ...(attributes && Object.keys(attributes).length > 0 ? { attributes } : {}),
    children,
  };
}

function mdxProps(
  attributes: readonly MdxAttribute[] | undefined,
): Readonly<Record<string, PostkitJsonValue>> | undefined {
  const props: Record<string, PostkitJsonValue> = Object.create(null) as Record<
    string,
    PostkitJsonValue
  >;
  for (const attribute of attributes ?? []) {
    if (attribute.type === 'mdxJsxExpressionAttribute') {
      throw new PostkitParseError(
        'unsafe-mdx-expression',
        'MDX spread attributes are not supported by the safe Postkit parser.',
      );
    }
    if (!attribute.name || !safePropName(attribute.name)) continue;
    if (attribute.value === null || attribute.value === undefined) {
      props[attribute.name] = true;
      continue;
    }
    if (typeof attribute.value === 'string') {
      if (attribute.name === 'data-postkit-props') {
        try {
          const value = JSON.parse(attribute.value) as unknown;
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            isPostkitJsonValue(value)
          ) {
            for (const [name, item] of Object.entries(value)) {
              if (safePropName(name)) props[name] = item;
            }
          }
        } catch {
          // Malformed reconstruction hints are ignored.
        }
        continue;
      }
      props[attribute.name] = attribute.value;
      continue;
    }
    throw new PostkitParseError(
      'unsafe-mdx-expression',
      `MDX expression prop "${attribute.name}" is not supported by the safe Postkit parser.`,
    );
  }
  return Object.keys(props).length > 0 ? props : undefined;
}

function convertChildren(
  children: readonly SyntaxNode[] | undefined,
  options: ConversionOptions,
): PostkitNode[] {
  if (children?.some((child) => child.type === 'html')) {
    // Parse a complete sibling stream so opening/closing raw tags retain the
    // Markdown text, emphasis, links, and code between them.
    const nodes = children.flatMap((child): HastNode[] =>
      child.type === 'html'
        ? [{ type: 'raw', value: child.value ?? '' } as unknown as HastNode]
        : convertNode(child, options).map(toHast),
    );
    const tree = raw(
      { type: 'root', children: nodes as RootContent[] },
      { passThrough: ['postkitNode'] },
    );
    return [
      ...normalizePostkitHtmlTree(tree, {
        allowComponent: options.allowComponent,
      }).children,
    ];
  }
  return (children ?? []).flatMap((child) => convertNode(child, options));
}

function toHast(node: PostkitNode): HastNode {
  if (node.type === 'text') return { type: 'text', value: node.value };
  // These nodes have already been converted (including any nested raw HTML).
  // Re-tokenizing them as HTML would coerce portable metadata such as
  // checked:false and spread:true into absent or empty HTML attributes.
  return {
    type: 'postkitNode',
    data: { postkitNode: node },
  } as unknown as HastNode;
}

function convertTableRow(
  node: SyntaxNode,
  options: ConversionOptions,
  cellName: 'td' | 'th',
): PostkitNode {
  return element(
    'tr',
    (node.children ?? []).map((cell) =>
      element(cellName, convertChildren(cell.children, options)),
    ),
  );
}

function convertNode(
  node: SyntaxNode,
  options: ConversionOptions,
): PostkitNode[] {
  const children = () => convertChildren(node.children, options);
  switch (node.type) {
    case 'definition':
      return [];
    case 'linkReference':
    case 'imageReference': {
      const definition = options.definitions.get(node.identifier ?? '');
      if (!definition) return children();
      return convertNode(
        {
          ...node,
          type: node.type === 'linkReference' ? 'link' : 'image',
          url: definition.url,
          title: definition.title,
        },
        options,
      );
    }
    case 'root':
      return children();
    case 'text':
      return [{ type: 'text', value: node.value ?? '' }];
    case 'paragraph':
      return [element('p', children())];
    case 'heading':
      return [element(`h${node.depth ?? 1}`, children())];
    case 'emphasis':
      return [element('em', children())];
    case 'strong':
      return [element('strong', children())];
    case 'delete':
      return [element('del', children())];
    case 'blockquote':
      return [element('blockquote', children())];
    case 'thematicBreak':
      return [element('hr', [])];
    case 'break':
      return [element('br', [])];
    case 'inlineCode':
      return [element('code', [{ type: 'text', value: node.value ?? '' }])];
    case 'code':
      return [
        element('pre', [
          element('code', [{ type: 'text', value: node.value ?? '' }], {
            ...(node.lang ? { language: node.lang } : {}),
            ...(node.meta ? { meta: node.meta } : {}),
          }),
        ]),
      ];
    case 'link':
      return [
        element('a', children(), {
          href: node.url ?? '',
          ...(node.title ? { title: node.title } : {}),
        }),
      ];
    case 'image':
      return [
        element('img', [], {
          src: node.url ?? '',
          alt: node.alt ?? '',
          ...(node.title ? { title: node.title } : {}),
        }),
      ];
    case 'list':
      return [
        element(node.ordered ? 'ol' : 'ul', children(), {
          ...(node.ordered && node.start !== null && node.start !== undefined
            ? { start: node.start }
            : {}),
          ...(node.spread ? { spread: true } : {}),
        }),
      ];
    case 'listItem':
      return [
        element('li', children(), {
          ...(node.checked === true || node.checked === false
            ? { checked: node.checked }
            : {}),
          ...(node.spread ? { spread: true } : {}),
        }),
      ];
    case 'table': {
      const [header, ...body] = node.children ?? [];
      return [
        element('table', [
          ...(header
            ? [element('thead', [convertTableRow(header, options, 'th')])]
            : []),
          ...(body.length > 0
            ? [
                element(
                  'tbody',
                  body.map((row) => convertTableRow(row, options, 'td')),
                ),
              ]
            : []),
        ]),
      ];
    }
    case 'tableRow':
      return [element('tr', children())];
    case 'tableCell':
      return [element('td', children())];
    case 'html':
      return parsePostkitHtml(node.value ?? '', {
        allowComponent: options.allowComponent,
      }).children.slice();
    case 'mdxJsxFlowElement':
    case 'mdxJsxTextElement': {
      if (!node.name) return children();
      if (/^[a-z][a-z0-9-]*$/.test(node.name)) {
        const props = mdxProps(node.attributes);
        const attributes = props
          ? (Object.fromEntries(
              Object.entries(props).filter(
                (entry): entry is [string, PostkitAttributeValue] =>
                  !entry[0].startsWith('data-postkit-') &&
                  (typeof entry[1] === 'boolean' ||
                    typeof entry[1] === 'number' ||
                    typeof entry[1] === 'string'),
              ),
            ) as Record<string, PostkitAttributeValue>)
          : undefined;
        return [element(node.name, children(), attributes)];
      }
      if (options.allowComponent && !options.allowComponent(node.name)) {
        return children();
      }
      const props = mdxProps(node.attributes);
      return [
        {
          type: 'component',
          name: node.name,
          ...(props ? { props } : {}),
          children: children(),
        },
      ];
    }
    case 'mdxFlowExpression':
    case 'mdxTextExpression':
    case 'mdxjsEsm':
      throw new PostkitParseError(
        'unsafe-mdx-expression',
        'Executable MDX expressions and ESM are not supported by the safe Postkit parser.',
      );
    default:
      return children();
  }
}

export function parsePostkitMarkdown(
  source: string,
  options: ParsePostkitMarkdownOptions = {},
): PostkitDocument {
  const mdx = options.mdx === true;
  const root = fromMarkdown(source, {
    extensions: [gfm(), ...(mdx ? [mdxjs()] : [])],
    mdastExtensions: [gfmFromMarkdown(), ...(mdx ? [mdxFromMarkdown()] : [])],
  }) as SyntaxNode;
  // mdast normalizes reference identifiers. Definitions may follow their uses
  // or live inside containers; CommonMark gives the first definition priority.
  const definitions = new Map<string, SyntaxNode>();
  const collectDefinitions = (node: SyntaxNode) => {
    if (
      node.type === 'definition' &&
      node.identifier &&
      !definitions.has(node.identifier)
    ) {
      definitions.set(node.identifier, node);
    }
    node.children?.forEach(collectDefinitions);
  };
  collectDefinitions(root);
  return createPostkitDocument(
    convertChildren(root.children, { ...options, definitions }),
  );
}
