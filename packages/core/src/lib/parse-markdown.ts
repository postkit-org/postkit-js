import { fromMarkdown } from 'mdast-util-from-markdown';
import { directiveFromMarkdown } from 'mdast-util-directive';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { directive } from 'micromark-extension-directive';
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
import { normalizePostkitFootnoteIdentifier } from './footnotes.js';
import { PostkitParseError } from './parse-error.js';
import { normalizePostkitHtmlTree, parsePostkitHtml } from './parse-html.js';

export interface ParsePostkitMarkdownOptions {
  /** Parse MDX component syntax while continuing to reject executable expressions. */
  readonly mdx?: boolean;
  /** Allow only the component names accepted by this predicate. */
  readonly allowComponent?: (name: string) => boolean;
  /**
   * A footnote reference with no definition (`[^missing]`) fails with its
   * line and column by default (03 §7.1). `literal` keeps it as the text the
   * author wrote instead.
   */
  readonly missingFootnotes?: 'error' | 'literal';
}

interface SyntaxPoint {
  readonly line?: number;
  readonly column?: number;
  readonly offset?: number;
}

interface SyntaxNode {
  readonly type: string;
  readonly position?: {
    readonly start: SyntaxPoint;
    readonly end: SyntaxPoint;
  };
  readonly identifier?: string;
  readonly label?: string | null;
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
  readonly attributes?:
    | readonly MdxAttribute[]
    | Readonly<Record<string, string | null | undefined>>;
  readonly data?: { readonly directiveLabel?: boolean };
}

interface ConversionOptions extends ParsePostkitMarkdownOptions {
  readonly definitions: ReadonlyMap<string, SyntaxNode>;
  readonly source: string;
  /** Notes written in place (`:footnote[…]`, `<Footnote>…</Footnote>`). */
  readonly inlineNotes: PostkitNode[];
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
  attributes: SyntaxNode['attributes'],
): Readonly<Record<string, PostkitJsonValue>> | undefined {
  const props: Record<string, PostkitJsonValue> = Object.create(null) as Record<
    string,
    PostkitJsonValue
  >;
  for (const attribute of Array.isArray(attributes)
    ? (attributes as readonly MdxAttribute[])
    : []) {
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
  const nodes = (children ?? []).flatMap((child) =>
    convertNode(child, options),
  );
  // A directive kept as text (`10:30`) joins the text around it.
  return nodes.reduce<PostkitNode[]>((merged, node) => {
    const previous = merged.at(-1);
    if (
      node.type === 'text' &&
      previous?.type === 'text' &&
      children?.some((child) => child.type === 'textDirective')
    ) {
      merged[merged.length - 1] = {
        type: 'text',
        value: previous.value + node.value,
      };
    } else {
      merged.push(node);
    }
    return merged;
  }, []);
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

function sliceSource(
  options: ConversionOptions,
  start: SyntaxPoint | undefined,
  end: SyntaxPoint | undefined,
): string | undefined {
  if (start?.offset === undefined || end?.offset === undefined)
    return undefined;
  return options.source.slice(start.offset, end.offset);
}

/** `line:column` for an offset into the source. */
function pointAt(source: string, offset: number): string {
  const before = source.slice(0, offset).split(/\r\n|\r|\n/);
  return `${before.length}:${(before.at(-1)?.length ?? 0) + 1}`;
}

/**
 * GFM only links `[^id]` when `id` is defined; otherwise it stays text. A
 * reference with no definition fails the parse with its position (03 §7.1).
 */
function checkMissingFootnotes(
  node: SyntaxNode,
  options: ConversionOptions,
): void {
  if (options.missingFootnotes === 'literal') return;
  if (!node.value?.includes('[^')) return;
  const start = node.position?.start.offset;
  const raw = sliceSource(options, node.position?.start, node.position?.end);
  const match = /(?<!\\)\[\^([^\]\s]+)\]/.exec(raw ?? node.value);
  if (!match) return;
  const where =
    start !== undefined && raw !== undefined
      ? ` (${pointAt(options.source, start + match.index)})`
      : '';
  throw new PostkitParseError(
    'invalid-document',
    `Footnote [^${match[1]}] has no definition${where}.`,
  );
}

/** Registers a note written in place and returns its reference. */
function inlineNote(
  children: readonly PostkitNode[],
  options: ConversionOptions,
): PostkitNode {
  const identifier = `inline-${options.inlineNotes.length + 1}`;
  options.inlineNotes.push({
    type: 'footnoteDefinition',
    identifier,
    children: children.some(
      (child) => child.type === 'element' && child.name === 'p',
    )
      ? children
      : [element('p', children)],
  });
  return { type: 'footnoteReference', identifier };
}

/**
 * `<Footnote>note</Footnote>` is a note written in place, like
 * `:footnote[note]`; `<Footnote identifier="id" />` references a definition.
 */
function footnoteComponent(
  node: SyntaxNode,
  props: Readonly<Record<string, PostkitJsonValue>> | undefined,
  options: ConversionOptions,
): PostkitNode[] {
  const identifier = props?.['identifier'];
  // A reference the Markdown tooling numbered (`index`): its children are
  // only the copy shown beside it, so the note itself lives in the list.
  if (props?.['index'] !== undefined) {
    const id = String(identifier ?? props['index']);
    return [
      {
        type: 'footnoteReference',
        identifier: normalizePostkitFootnoteIdentifier(id),
        label: id,
      },
    ];
  }
  const content = convertChildren(node.children, options);
  if (content.length === 0 && typeof identifier === 'string' && identifier) {
    return [
      {
        type: 'footnoteReference',
        identifier: normalizePostkitFootnoteIdentifier(identifier),
        label: identifier,
      },
    ];
  }
  return [inlineNote(content, options)];
}

/**
 * `<Footnotes>` as the Markdown tooling writes it, with the notes as
 * `<Footnote>` children: the placed list (a component node with its props)
 * and a definition per note. An authored `<Footnotes />` has no children.
 */
function footnotesComponent(
  node: SyntaxNode,
  props: Readonly<Record<string, PostkitJsonValue>> | undefined,
  options: ConversionOptions,
): PostkitNode[] {
  const definitions = (node.children ?? []).flatMap((child): PostkitNode[] => {
    if (
      (child.type !== 'mdxJsxFlowElement' &&
        child.type !== 'mdxJsxTextElement') ||
      child.name !== 'Footnote'
    ) {
      return [];
    }
    const childProps = mdxProps(child.attributes);
    const id = String(
      childProps?.['identifier'] ?? childProps?.['index'] ?? '',
    );
    if (!id) return [];
    return [
      {
        type: 'footnoteDefinition',
        identifier: normalizePostkitFootnoteIdentifier(id),
        label: id,
        children: convertChildren(child.children, options),
      },
    ];
  });
  return [
    {
      type: 'component',
      name: 'Footnotes',
      ...(props ? { props } : {}),
      children: [],
    },
    ...definitions,
  ];
}

/**
 * Directives: `:footnote[…]` is a note written in place (03 §7.1). Every
 * other directive keeps the text the author wrote, as before directives
 * were parsed, with a container's body still parsed as Markdown.
 */
function convertDirective(
  node: SyntaxNode,
  options: ConversionOptions,
): PostkitNode[] {
  const name = node.name ?? '';
  if (
    node.type === 'textDirective' &&
    (name === 'footnote' || name === 'postkit-footnote')
  ) {
    return [inlineNote(convertChildren(node.children, options), options)];
  }
  const all = node.children ?? [];
  if (node.type === 'containerDirective') {
    const body = all[0]?.data?.directiveLabel === true ? all.slice(1) : all;
    const whole =
      sliceSource(options, node.position?.start, node.position?.end) ?? '';
    const lines = whole.split(/\r?\n/);
    const closing = lines.length > 1 ? lines.at(-1)?.trim() : undefined;
    return [
      element('p', [{ type: 'text', value: lines[0] || `:::${name}` }]),
      ...convertChildren(body, options),
      ...(closing && /^:{3,}$/.test(closing)
        ? [element('p', [{ type: 'text', value: closing }])]
        : []),
    ];
  }
  const first = all[0];
  const last = all.at(-1);
  const inline: PostkitNode[] =
    first && last
      ? [
          {
            type: 'text',
            value:
              sliceSource(
                options,
                node.position?.start,
                first.position?.start,
              ) ?? `:${name}[`,
          },
          ...convertChildren(all, options),
          {
            type: 'text',
            value:
              sliceSource(options, last.position?.end, node.position?.end) ??
              ']',
          },
        ]
      : [
          {
            type: 'text',
            value:
              sliceSource(options, node.position?.start, node.position?.end) ??
              `:${name}`,
          },
        ];
  return node.type === 'leafDirective' ? [element('p', inline)] : inline;
}

function convertNode(
  node: SyntaxNode,
  options: ConversionOptions,
): PostkitNode[] {
  const children = () => convertChildren(node.children, options);
  switch (node.type) {
    case 'footnoteReference':
      return [
        {
          type: 'footnoteReference',
          identifier: node.identifier ?? '',
          ...(node.label ? { label: node.label } : {}),
        },
      ];
    case 'footnoteDefinition':
      return [
        {
          type: 'footnoteDefinition',
          identifier: node.identifier ?? '',
          ...(node.label ? { label: node.label } : {}),
          children: children(),
        },
      ];
    case 'textDirective':
    case 'leafDirective':
    case 'containerDirective':
      return convertDirective(node, options);
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
      checkMissingFootnotes(node, options);
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
      if (node.name === 'Footnote') {
        return footnoteComponent(node, props, options);
      }
      if (node.name === 'Footnotes') {
        return footnotesComponent(node, props, options);
      }
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
  // Directive syntax is only parsed for `:footnote[…]`; other directives keep
  // their text (`convertDirective`).
  const directives = /:(?:postkit-)?footnote\[/.test(source);
  const root = fromMarkdown(source, {
    extensions: [
      gfm(),
      ...(directives ? [directive()] : []),
      ...(mdx ? [mdxjs()] : []),
    ],
    mdastExtensions: [
      gfmFromMarkdown(),
      ...(directives ? [directiveFromMarkdown()] : []),
      ...(mdx ? [mdxFromMarkdown()] : []),
    ],
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
  const inlineNotes: PostkitNode[] = [];
  const children = convertChildren(root.children, {
    ...options,
    definitions,
    source,
    inlineNotes,
  });
  return createPostkitDocument([...children, ...inlineNotes]);
}
