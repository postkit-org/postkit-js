import {
  parsePostkitFootnotePlacement,
  type PostkitFootnoteMarker,
  type PostkitFootnoteNumbering,
  type PostkitFootnotePlacementValue,
  postkitFootnoteMarkers,
  postkitFootnoteNumberings,
  postkitFootnoteScope,
} from '@postkit/core/components';

/**
 * Footnotes for `remarkPostkit` (03 §7.1): GFM `[^id]`, the inline directive
 * `:footnote[…]` and `<Footnote>…</Footnote>` become `Footnote` references,
 * numbered by first reference, and one `Footnotes` list, where `::footnotes`
 * or `<Footnotes />` places it or at the end of the document.
 */

interface Point {
  line: number;
  column: number;
  offset?: number;
}

/** The mdast fields the transform reads and writes. */
export interface PostkitFootnoteSyntaxNode {
  type: string;
  name?: string | null;
  value?: string | null;
  identifier?: string;
  label?: string | null;
  attributes?: unknown;
  children?: PostkitFootnoteSyntaxNode[];
  data?: Record<string, unknown>;
  position?: { start: Point; end: Point };
  [key: string]: unknown;
}

/** How the transform reports problems, with the file and position. */
export interface PostkitFootnoteReporter {
  fail(node: PostkitFootnoteSyntaxNode, ruleId: string, reason: string): never;
  warn(node: PostkitFootnoteSyntaxNode, ruleId: string, reason: string): void;
}

/** Options for {@link transformPostkitFootnotes}. */
export interface PostkitFootnoteTransformOptions {
  readonly output: 'hast' | 'mdx';
  /** Prefixes the ids (`fn-{scope}-1`), usually the document's slug. */
  readonly scope?: string;
  /**
   * The site's list settings (placement, marker, numbering, …), written onto
   * the list and its references. An authored `::footnotes` or
   * `<Footnotes />` overrides them.
   */
  readonly defaults?: PostkitRemarkFootnoteDefaults;
  /** The source text, to find `[^id]` references with no definition. */
  readonly source?: string;
  readonly report: PostkitFootnoteReporter;
}

type Node = PostkitFootnoteSyntaxNode;

/** Site settings for every document's footnotes (03 §7.1). */
export interface PostkitRemarkFootnoteDefaults {
  readonly placement?: PostkitFootnotePlacementValue;
  readonly marker?: PostkitFootnoteMarker;
  readonly numbering?: PostkitFootnoteNumbering;
  readonly sideBreakpoint?: number;
  readonly title?: string | false;
  readonly backlinks?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'outline' | 'subtle' | 'plain';
}

/** Settings as element attributes: strings, with a placement object as JSON. */
function defaultProps(
  defaults: PostkitRemarkFootnoteDefaults | undefined,
): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [name, value] of Object.entries(defaults ?? {})) {
    if (value === undefined || value === null) continue;
    props[name] =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
  return props;
}

interface Note {
  readonly identifier: string;
  readonly label: string;
  readonly definition: Node;
  index: number;
  references: number;
}

const LIST_PROPS = [
  'title',
  'backlinks',
  'marker',
  'numbering',
  'placement',
  'sideBreakpoint',
  'scope',
  'size',
  'variant',
] as const;

/** List props a reference shares, so marks match the list. */
const SHARED_PROPS = ['marker', 'numbering', 'placement', 'sideBreakpoint'];

const SKIPPED = new Set([
  'code',
  'inlineCode',
  'html',
  'mdxjsEsm',
  'mdxFlowExpression',
  'mdxTextExpression',
  'yaml',
  'toml',
]);

function normalize(value: string): string {
  return value
    .replace(/[\t\n\r ]+/g, ' ')
    .trim()
    .toLowerCase()
    .toUpperCase()
    .toLowerCase();
}

function isInlineNote(node: Node): boolean {
  if (
    node.type === 'textDirective' &&
    (node.name === 'footnote' || node.name === 'postkit-footnote')
  ) {
    return true;
  }
  return (
    (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
    node.name === 'Footnote' &&
    (node.children?.length ?? 0) > 0 &&
    attributeValue(node, 'index') === undefined
  );
}

function isPlacement(node: Node): boolean {
  if (
    node.type === 'leafDirective' &&
    (node.name === 'footnotes' || node.name === 'postkit-footnotes')
  ) {
    return true;
  }
  return node.type === 'mdxJsxFlowElement' && node.name === 'Footnotes';
}

/** A literal attribute on a directive or MDX element. */
function attributeValue(node: Node, name: string): string | undefined {
  if (Array.isArray(node.attributes)) {
    for (const attribute of node.attributes as {
      type?: string;
      name?: string;
      value?: unknown;
    }[]) {
      if (attribute.type !== 'mdxJsxAttribute' || attribute.name !== name) {
        continue;
      }
      if (attribute.value === null || attribute.value === undefined) {
        return 'true';
      }
      // Expressions (`placement={{ … }}`) stay on the element for the host
      // to evaluate; only literal values are read here.
      return typeof attribute.value === 'string' ? attribute.value : undefined;
    }
    return undefined;
  }
  if (node.attributes && typeof node.attributes === 'object') {
    const value = (node.attributes as Record<string, unknown>)[name];
    if (value === null) return 'true';
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/** The literal props an author set on the placed list. */
function listProps(
  node: Node | undefined,
  report: PostkitFootnoteReporter,
): Record<string, string> {
  const props: Record<string, string> = {};
  if (!node) return props;
  for (const name of LIST_PROPS) {
    const value = attributeValue(node, name);
    if (value !== undefined) props[name] = value;
  }
  const check = (name: string, values: readonly string[]) => {
    const value = props[name];
    if (value !== undefined && !values.includes(value)) {
      report.fail(
        node,
        'invalid-prop',
        `Invalid Footnotes ${name} value "${value}".`,
      );
    }
  };
  check('marker', postkitFootnoteMarkers);
  check('numbering', postkitFootnoteNumberings);
  if (
    props['placement'] !== undefined &&
    parsePostkitFootnotePlacement(props['placement']) === undefined
  ) {
    report.fail(
      node,
      'invalid-prop',
      `Invalid Footnotes placement value "${props['placement']}".`,
    );
  }
  return props;
}

/**
 * A note's content as phrasing, for the copy beside its reference
 * (sidenote, popover, inline): paragraphs join with line breaks, lists and
 * quotes flatten, code becomes inline code. A reference sits inside a
 * paragraph, which can't hold blocks.
 */
function phrasing(blocks: readonly Node[]): Node[] {
  const result: Node[] = [];
  const push = (nodes: readonly Node[]) => {
    if (nodes.length === 0) return;
    if (result.length > 0) result.push({ type: 'break' });
    result.push(...nodes);
  };
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        push(structuredClone(block.children ?? []));
        break;
      case 'heading':
        push([
          { type: 'strong', children: structuredClone(block.children ?? []) },
        ]);
        break;
      case 'code':
        push([{ type: 'inlineCode', value: block.value ?? '' }]);
        break;
      case 'list':
        for (const item of block.children ?? []) {
          const content = phrasing(item.children ?? []);
          push(
            content.length > 0
              ? [{ type: 'text', value: '• ' }, ...content]
              : [],
          );
        }
        break;
      case 'blockquote':
        push(phrasing(block.children ?? []));
        break;
      default:
        break;
    }
  }
  // Nested marks would repeat ids.
  const strip = (nodes: Node[]): Node[] =>
    nodes
      .filter(
        (node) =>
          node.type !== 'footnoteReference' &&
          node.name !== 'Footnote' &&
          node.data?.['hName'] !== 'Footnote',
      )
      .map((node) =>
        node.children ? { ...node, children: strip(node.children) } : node,
      );
  return strip(result);
}

function element(
  output: 'hast' | 'mdx',
  flow: boolean,
  name: string,
  props: Record<string, string>,
  children: Node[],
  position?: Node['position'],
): Node {
  if (output === 'hast') {
    return {
      type: flow ? 'postkitFootnotesFlow' : 'postkitFootnotePhrasing',
      data: { hName: name, hProperties: { ...props } },
      children,
      ...(position ? { position } : {}),
    };
  }
  return {
    type: flow ? 'mdxJsxFlowElement' : 'mdxJsxTextElement',
    name,
    attributes: Object.entries(props).map(([key, value]) => ({
      type: 'mdxJsxAttribute',
      name: key,
      value,
    })),
    children,
    ...(position ? { position } : {}),
  };
}

/** `line:column` → offset into the source, for the text nodes' raw form. */
function slice(source: string | undefined, node: Node): string | undefined {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (source === undefined || start === undefined || end === undefined) {
    return undefined;
  }
  return source.slice(start, end);
}

/** The point at an offset into the source. */
function pointAt(source: string, offset: number): Point {
  const lines = source.slice(0, offset).split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
    offset,
  };
}

/** A stand-in node covering just the `[^id]` within a text node. */
function locateMatch(
  node: Node,
  source: string | undefined,
  index: number,
  length: number,
): Node {
  const start = node.position?.start.offset;
  if (source === undefined || start === undefined) return node;
  return {
    type: 'text',
    position: {
      start: pointAt(source, start + index),
      end: pointAt(source, start + index + length),
    },
  };
}

/**
 * Turns a document's footnotes into `Footnote` and `Footnotes` elements, in
 * place. Fails on a reference with no definition and warns about a
 * definition nobody references (03 §7.1).
 */
export function transformPostkitFootnotes(
  tree: Node,
  options: PostkitFootnoteTransformOptions,
): void {
  const { report } = options;
  const definitions = new Map<string, Node>();
  const references: { node: Node; identifier: string }[] = [];
  const removals = new Set<Node>();
  let placement: Node | undefined;
  let inline = 0;

  const defineInline = (node: Node): string => {
    inline += 1;
    const identifier = `inline-${inline}`;
    const content = node.children ?? [];
    const blocks = content.every((child) =>
      ['paragraph', 'list', 'code', 'blockquote', 'heading'].includes(
        child.type,
      ),
    )
      ? content
      : [{ type: 'paragraph', children: content }];
    definitions.set(identifier, {
      type: 'footnoteDefinition',
      identifier,
      label: identifier,
      children: blocks,
      ...(node.position ? { position: node.position } : {}),
    });
    return identifier;
  };

  const walk = (parent: Node, inDefinition: boolean) => {
    const children = parent.children;
    if (!children) return;
    for (let index = 0; index < children.length; index += 1) {
      const node = children[index] as Node;
      if (SKIPPED.has(node.type)) continue;
      if (node.type === 'footnoteDefinition' && !inDefinition) {
        const identifier = normalize(node.identifier ?? '');
        if (definitions.has(identifier)) {
          report.warn(
            node,
            'duplicate-footnote',
            `Footnote [^${node.label ?? node.identifier}] is defined more than once; the first definition is used.`,
          );
        } else {
          definitions.set(identifier, node);
        }
        removals.add(node);
        continue;
      }
      if (node.type === 'footnoteReference') {
        references.push({ node, identifier: normalize(node.identifier ?? '') });
        continue;
      }
      if (isInlineNote(node)) {
        const identifier = defineInline(node);
        const reference: Node = {
          type: 'footnoteReference',
          identifier,
          label: identifier,
          ...(node.position ? { position: node.position } : {}),
        };
        children[index] = reference;
        references.push({ node: reference, identifier });
        continue;
      }
      if (
        (node.type === 'mdxJsxTextElement' ||
          node.type === 'mdxJsxFlowElement') &&
        node.name === 'Footnote' &&
        attributeValue(node, 'index') === undefined
      ) {
        const id = attributeValue(node, 'identifier');
        if (id) {
          const reference: Node = {
            type: 'footnoteReference',
            identifier: normalize(id),
            label: id,
            ...(node.position ? { position: node.position } : {}),
          };
          children[index] = reference;
          references.push({ node: reference, identifier: normalize(id) });
          continue;
        }
      }
      if (isPlacement(node) && !inDefinition) {
        if (placement) {
          report.warn(
            node,
            'duplicate-footnotes',
            'Footnotes is placed more than once; the first placement is used.',
          );
          removals.add(node);
        } else {
          placement = node;
        }
        continue;
      }
      if (node.type === 'text' && node.value?.includes('[^')) {
        const raw = slice(options.source, node) ?? node.value;
        const match = /(?<!\\)\[\^([^\]\s]+)\]/.exec(raw);
        if (match) {
          report.fail(
            locateMatch(node, options.source, match.index, match[0].length),
            'missing-footnote',
            `Footnote [^${match[1]}] has no definition.`,
          );
        }
      }
      walk(node, inDefinition);
    }
  };
  walk(tree, false);

  // Number by first reference; references inside notes follow their note.
  const notes = new Map<string, Note>();
  const order: Note[] = [];
  const count = (start: number) => {
    for (let position = start; position < references.length; position += 1) {
      const { node, identifier } = references[position] as {
        node: Node;
        identifier: string;
      };
      const definition = definitions.get(identifier);
      if (!definition) {
        report.fail(
          node,
          'missing-footnote',
          `Footnote [^${node.label ?? node.identifier}] has no definition.`,
        );
        continue;
      }
      let note = notes.get(identifier);
      if (!note) {
        note = {
          identifier,
          label: String(definition.label ?? node.label ?? identifier),
          definition,
          index: order.length + 1,
          references: 0,
        };
        notes.set(identifier, note);
        order.push(note);
      }
      note.references += 1;
    }
  };
  count(0);
  for (let position = 0; position < order.length; position += 1) {
    const before = references.length;
    walk(order[position]?.definition as Node, true);
    count(before);
  }

  for (const [identifier, definition] of definitions) {
    if (notes.has(identifier)) continue;
    report.warn(
      definition,
      'unreferenced-footnote',
      `Footnote [^${definition.label ?? definition.identifier}] is defined but never referenced; it is left out.`,
    );
  }

  const props = {
    ...defaultProps(options.defaults),
    ...listProps(placement, report),
  };
  const scope = postkitFootnoteScope(props['scope'] ?? options.scope);
  if (scope) props['scope'] = scope;
  const shared = Object.fromEntries(
    SHARED_PROPS.flatMap((name) => {
      const value = props[name];
      return value === undefined ? [] : [[name, value] as const];
    }),
  );

  // The copy beside each first reference, taken before marks are replaced.
  const copies = new Map(
    order.map((note) => [
      note.identifier,
      phrasing(note.definition.children ?? []),
    ]),
  );

  const occurrences = new Map<string, number>();
  for (const { node, identifier } of references) {
    const note = notes.get(identifier) as Note;
    const occurrence = (occurrences.get(identifier) ?? 0) + 1;
    occurrences.set(identifier, occurrence);
    const replacement = element(
      options.output,
      false,
      'Footnote',
      {
        identifier: note.label,
        index: String(note.index),
        ...(occurrence > 1 ? { occurrence: String(occurrence) } : {}),
        ...(scope ? { scope } : {}),
        ...shared,
      },
      occurrence === 1 ? (copies.get(identifier) ?? []) : [],
      node.position,
    );
    // Replace in place: the reference node object is what its parent holds.
    for (const key of Object.keys(node)) delete node[key];
    Object.assign(node, replacement);
  }

  const list =
    order.length > 0
      ? element(
          options.output,
          true,
          'Footnotes',
          props,
          order.map((note) =>
            element(
              options.output,
              true,
              'Footnote',
              {
                identifier: note.label,
                index: String(note.index),
                references: String(note.references),
                ...(scope ? { scope } : {}),
              },
              note.definition.children ?? [],
            ),
          ),
          placement?.position,
        )
      : undefined;

  if (placement && list && placement.type === 'mdxJsxFlowElement') {
    // Keep authored expression props (`placement={{ … }}`) on the element.
    const kept = (placement.attributes as unknown[]).filter(
      (attribute) =>
        typeof (attribute as { value?: unknown }).value === 'object' &&
        (attribute as { value?: unknown }).value !== null,
    );
    if (options.output === 'mdx') {
      list.attributes = [...(list.attributes as unknown[]), ...kept];
    }
  }

  const prune = (parent: Node) => {
    if (!parent.children) return;
    parent.children = parent.children.flatMap((child) => {
      if (removals.has(child)) return [];
      if (child === placement) return list ? [list] : [];
      prune(child);
      return [child];
    });
  };
  prune(tree);
  if (list && !placement) tree.children = [...(tree.children ?? []), list];
}
