import {
  postkitDeclarationManifest,
  type PostkitComponentDeclaration,
  type PostkitComponentName,
} from './declarations.js';

type DirectiveAttributeValue = string | null | undefined;

interface DirectiveData {
  hName?: string;
  hProperties?: Record<string, string | boolean>;
  [key: string]: unknown;
}

interface PostkitPoint {
  line: number;
  column: number;
  offset?: number;
}

interface PostkitPosition {
  start: PostkitPoint;
  end: PostkitPoint;
}

export interface PostkitDirectiveNode {
  type: string;
  name?: string;
  value?: string | null;
  attributes?: Record<string, DirectiveAttributeValue> | PostkitDirectiveNode[];
  children?: PostkitDirectiveNode[];
  data?: DirectiveData;
  position?: PostkitPosition;
  [key: string]: unknown;
}

/**
 * The parts of a unified `VFile` the transform uses. Messages are reported
 * through `message` (warnings) and `fail` (errors that stop the build).
 */
export interface PostkitVFileLike {
  readonly path?: string;
  readonly history?: readonly string[];
  readonly value?: unknown;
  message(
    reason: string,
    options?: {
      place?: PostkitPosition;
      ruleId?: string;
      source?: string;
    },
  ): unknown;
  fail(
    reason: string,
    options?: {
      place?: PostkitPosition;
      ruleId?: string;
      source?: string;
    },
  ): never;
}

export interface RemarkPostkitOptions {
  /**
   * `mdx` emits MDX JSX nodes. `hast` annotates directives for pipelines such
   * as react-markdown that turn `data.hName` into a registered component.
   */
  readonly output?: 'hast' | 'mdx';
  /**
   * Strict mode (the default) fails the build, with the file and line, on an
   * unknown `postkit-*` directive, an unknown MDX component and an unknown
   * prop. With `strict: false` those are reported as warnings on the file
   * (`file.messages`): unknown directives and components render as before
   * and unknown props are dropped. Invalid values and missing required props
   * fail in both modes.
   */
  readonly strict?: boolean;
  /**
   * Extra MDX component names the host provides through its component map,
   * such as site-only components. Postkit components, intrinsic elements and
   * names imported or exported by the document are always known.
   */
  readonly components?: readonly string[];
}

interface ResolvedOptions {
  readonly output: 'hast' | 'mdx';
  readonly strict: boolean;
  readonly components: ReadonlySet<string>;
}

interface TransformContext {
  readonly options: ResolvedOptions;
  readonly file: PostkitVFileLike | undefined;
  readonly source: string | undefined;
  readonly boundNames: ReadonlySet<string>;
}

const RULE_SOURCE = 'postkit';
const DIRECTIVE_PREFIX = 'postkit-';

const componentByDirective = new Map<string, PostkitComponentDeclaration>(
  Object.values(postkitDeclarationManifest.components).flatMap(
    (declaration) => [
      [declaration.directive, declaration],
      [declaration.name.toLowerCase(), declaration],
    ],
  ),
);

const directiveMarkers: Readonly<Record<string, string>> = {
  textDirective: ':',
  leafDirective: '::',
  containerDirective: ':::',
};

function isDirective(node: PostkitDirectiveNode): boolean {
  return Object.prototype.hasOwnProperty.call(directiveMarkers, node.type);
}

function isMdxJsxElement(node: PostkitDirectiveNode): boolean {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function stringifyPoint(point: PostkitPoint): string {
  return `${point.line}:${point.column}`;
}

function filePath(file: PostkitVFileLike | undefined): string | undefined {
  return file?.path || file?.history?.at(-1) || undefined;
}

/**
 * Formats a reason with the file and `line:column-line:column`, so hosts that
 * only print `error.message` (next-mdx-remote, Next.js) still point at it.
 */
function locate(
  reason: string,
  node: PostkitDirectiveNode,
  file: PostkitVFileLike | undefined,
): string {
  const where = [
    filePath(file),
    node.position
      ? `${stringifyPoint(node.position.start)}-${stringifyPoint(node.position.end)}`
      : undefined,
  ].filter(Boolean);

  return where.length > 0 ? `${reason} (${where.join(':')})` : reason;
}

function fail(
  context: Pick<TransformContext, 'file'>,
  node: PostkitDirectiveNode,
  ruleId: string,
  reason: string,
): never {
  const message = locate(reason, node, context.file);
  if (context.file) {
    context.file.fail(message, {
      place: node.position,
      ruleId,
      source: RULE_SOURCE,
    });
  }
  throw new TypeError(message);
}

function warn(
  context: Pick<TransformContext, 'file'>,
  node: PostkitDirectiveNode,
  ruleId: string,
  reason: string,
): void {
  context.file?.message(locate(reason, node, context.file), {
    place: node.position,
    ruleId,
    source: RULE_SOURCE,
  });
}

function coerceHastValue(
  value: DirectiveAttributeValue,
  kind: string,
): string | boolean {
  if (kind === 'boolean') {
    return value === null || value === undefined || value === 'true';
  }

  return value ?? '';
}

function invalidValueReason(
  declaration: PostkitComponentDeclaration,
  name: string,
  value: string,
): string | undefined {
  const prop = declaration.props[name];
  if (!prop) {
    return undefined;
  }

  if (prop.kind === 'enum' && !prop.values?.includes(value)) {
    return `Invalid ${declaration.name} ${name} value "${value}".`;
  }

  if (prop.kind === 'json') {
    try {
      JSON.parse(value);
    } catch {
      return `Invalid ${declaration.name} ${name} value: expected literal JSON data, not a JavaScript expression or malformed JSON.`;
    }
  }

  if (
    prop.kind === 'number' &&
    (value.trim() === '' || !Number.isFinite(Number(value)))
  ) {
    return `Invalid ${declaration.name} ${name} value "${value}": expected a number.`;
  }

  return undefined;
}

function validateAttributes(
  node: PostkitDirectiveNode,
  declaration: PostkitComponentDeclaration,
  attributes: Record<string, DirectiveAttributeValue>,
  context: TransformContext,
): Record<string, DirectiveAttributeValue> {
  const validated: Record<string, DirectiveAttributeValue> = {};

  for (const [name, value] of Object.entries(attributes)) {
    const prop = declaration.props[name];
    if (!prop) {
      const reason = `Unknown ${declaration.name} prop "${name}" in Postkit directive.`;
      if (context.options.strict) {
        fail(context, node, 'unknown-prop', reason);
      }
      warn(context, node, 'unknown-prop', `${reason} It was dropped.`);
      continue;
    }

    if (value !== null && value !== undefined) {
      const reason = invalidValueReason(declaration, name, value);
      if (reason) {
        fail(context, node, 'invalid-prop', reason);
      }
    }

    validated[name] = value;
  }

  for (const [name, prop] of Object.entries(declaration.props)) {
    if (
      prop.required &&
      (validated[name] === undefined || validated[name] === null)
    ) {
      fail(
        context,
        node,
        'missing-prop',
        `Postkit ${declaration.name} directive requires "${name}".`,
      );
    }
  }

  return validated;
}

function mdxAttributes(
  attributes: Record<string, DirectiveAttributeValue>,
): PostkitDirectiveNode[] {
  return Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value: value === null || value === undefined ? null : value,
  }));
}

function transformDirective(
  node: PostkitDirectiveNode,
  declaration: PostkitComponentDeclaration,
  context: TransformContext,
): void {
  const sourceAttributes =
    node.attributes && !Array.isArray(node.attributes) ? node.attributes : {};
  const attributes = validateAttributes(
    node,
    declaration,
    sourceAttributes,
    context,
  );

  if (context.options.output === 'hast') {
    node.data = {
      ...node.data,
      hName: declaration.name,
      hProperties: Object.fromEntries(
        Object.entries(attributes).map(([name, value]) => [
          name,
          coerceHastValue(value, declaration.props[name]?.kind ?? 'string'),
        ]),
      ),
    };
    return;
  }

  node.type =
    node.type === 'textDirective' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement';
  node.name = declaration.name;
  node.attributes = mdxAttributes(attributes);
  node.children ??= [];
  delete node.data;
}

function sliceSource(
  context: TransformContext,
  start: PostkitPoint | undefined,
  end: PostkitPoint | undefined,
): string | undefined {
  if (
    context.source === undefined ||
    start?.offset === undefined ||
    end?.offset === undefined
  ) {
    return undefined;
  }
  return context.source.slice(start.offset, end.offset);
}

function serializeAttributes(
  attributes: PostkitDirectiveNode['attributes'],
): string {
  if (!attributes || Array.isArray(attributes)) {
    return '';
  }
  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return '';
  }
  return `{${entries
    .map(([name, value]) =>
      value === null || value === undefined || value === ''
        ? name
        : `${name}="${value.replaceAll('"', '&quot;')}"`,
    )
    .join(' ')}}`;
}

function textNode(
  value: string,
  start?: PostkitPoint,
  end?: PostkitPoint,
): PostkitDirectiveNode {
  return start && end
    ? { type: 'text', value, position: { start, end } }
    : { type: 'text', value };
}

/**
 * Rebuilds an unrecognised directive as the text the author wrote, so "4.5:1",
 * "10:30" or `:smile_cat:` read as written instead of becoming an empty block.
 * The directive's label keeps its parsed Markdown.
 */
function literalDirective(
  node: PostkitDirectiveNode,
  context: TransformContext,
): PostkitDirectiveNode[] {
  const marker = directiveMarkers[node.type] ?? ':';
  const children = node.children ?? [];
  const start = node.position?.start;
  const end = node.position?.end;

  if (node.type === 'containerDirective') {
    const labelled = children[0]?.data?.['directiveLabel'] === true;
    const body = labelled ? children.slice(1) : children;
    const whole = sliceSource(context, start, end);
    const lines = whole?.split(/\r?\n/);
    const opening =
      lines?.[0] ??
      `${marker}${node.name ?? ''}${serializeAttributes(node.attributes)}`;
    const closingLine = lines && lines.length > 1 ? lines.at(-1) : undefined;
    const closing =
      lines === undefined
        ? marker
        : closingLine && /^\s*:{3,}\s*$/.test(closingLine)
          ? closingLine.trim()
          : undefined;

    return [
      { type: 'paragraph', children: [textNode(opening)] },
      ...body,
      ...(closing
        ? [{ type: 'paragraph', children: [textNode(closing)] }]
        : []),
    ];
  }

  const first = children[0];
  const last = children.at(-1);
  const inline: PostkitDirectiveNode[] = [];

  if (first && last) {
    const prefix =
      sliceSource(context, start, first.position?.start) ??
      `${marker}${node.name ?? ''}[`;
    const suffix =
      sliceSource(context, last.position?.end, end) ??
      `]${serializeAttributes(node.attributes)}`;
    inline.push(
      textNode(prefix, start, first.position?.start),
      ...children,
      textNode(suffix, last.position?.end, end),
    );
  } else {
    inline.push(
      textNode(
        sliceSource(context, start, end) ??
          `${marker}${node.name ?? ''}${serializeAttributes(node.attributes)}`,
        start,
        end,
      ),
    );
  }

  return node.type === 'leafDirective'
    ? [{ type: 'paragraph', children: inline, position: node.position }]
    : inline;
}

/** Joins adjacent text nodes, such as the halves around a literal `:1`. */
function mergeText(children: PostkitDirectiveNode[]): PostkitDirectiveNode[] {
  const merged: PostkitDirectiveNode[] = [];
  for (const child of children) {
    const previous = merged.at(-1);
    if (previous?.type === 'text' && child.type === 'text') {
      merged[merged.length - 1] = {
        type: 'text',
        value: `${previous.value ?? ''}${child.value ?? ''}`,
        ...(previous.position?.start && child.position?.end
          ? {
              position: {
                start: previous.position.start,
                end: child.position.end,
              },
            }
          : {}),
      };
    } else {
      merged.push(child);
    }
  }
  return merged;
}

function checkMdxComponent(
  node: PostkitDirectiveNode,
  context: TransformContext,
): void {
  const name = node.name;
  if (
    !name ||
    !/^[A-Z]/.test(name) ||
    /[.:]/.test(name) ||
    isPostkitComponentName(name) ||
    context.options.components.has(name) ||
    context.boundNames.has(name)
  ) {
    return;
  }

  const reason = `Unknown MDX component <${name}>: it isn't a Postkit component, imported by the document or listed in \`components\`.`;
  if (context.options.strict) {
    fail(context, node, 'unknown-component', reason);
  }
  warn(context, node, 'unknown-component', reason);
}

/**
 * Handles one directive. Returns replacement nodes when it was turned back
 * into literal text, or `undefined` when the node stays in place.
 */
function handleDirective(
  node: PostkitDirectiveNode,
  context: TransformContext,
): PostkitDirectiveNode[] | undefined {
  const name = node.name ?? '';
  const declaration = componentByDirective.get(name);
  if (declaration) {
    transformDirective(node, declaration, context);
    return undefined;
  }

  // Another plugin, run before this one, already handles this directive.
  if (node.data?.hName !== undefined) {
    return undefined;
  }

  if (name.startsWith(DIRECTIVE_PREFIX)) {
    const reason = `Unknown Postkit directive "${name}". Check the name against the component catalog.`;
    if (context.options.strict) {
      fail(context, node, 'unknown-directive', reason);
    }
    warn(context, node, 'unknown-directive', reason);
    return undefined;
  }

  return literalDirective(node, context);
}

function visitChildren(
  parent: PostkitDirectiveNode,
  context: TransformContext,
): void {
  if (!parent.children) {
    return;
  }

  let replaced = false;
  const next: PostkitDirectiveNode[] = [];
  const queue = [...parent.children];

  while (queue.length > 0) {
    const child = queue.shift() as PostkitDirectiveNode;

    if (isDirective(child)) {
      const replacement = handleDirective(child, context);
      if (replacement) {
        replaced = true;
        // Literal nodes keep the directive's children, which may hold
        // further directives: visit them in place.
        queue.unshift(...replacement);
        continue;
      }
    } else if (isMdxJsxElement(child)) {
      checkMdxComponent(child, context);
    }

    visitChildren(child, context);
    next.push(child);
  }

  parent.children = replaced ? mergeText(next) : next;
}

function readSource(file: PostkitVFileLike | undefined): string | undefined {
  const value = file?.value;
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  return undefined;
}

interface EstreeNodeLike {
  type: string;
  [key: string]: unknown;
}

function collectBindings(node: unknown, names: Set<string>): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  const estree = node as EstreeNodeLike;
  switch (estree.type) {
    case 'Identifier':
      names.add(estree['name'] as string);
      return;
    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
      collectBindings(estree['local'], names);
      return;
    case 'ImportDeclaration':
      (estree['specifiers'] as unknown[]).forEach((specifier) =>
        collectBindings(specifier, names),
      );
      return;
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      collectBindings(estree['declaration'], names);
      return;
    case 'VariableDeclaration':
      (estree['declarations'] as EstreeNodeLike[]).forEach((declarator) =>
        collectBindings(declarator['id'], names),
      );
      return;
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      collectBindings(estree['id'], names);
      return;
    case 'ObjectPattern':
      (estree['properties'] as EstreeNodeLike[]).forEach((property) =>
        collectBindings(
          property.type === 'RestElement'
            ? property['argument']
            : property['value'],
          names,
        ),
      );
      return;
    case 'ArrayPattern':
      (estree['elements'] as unknown[]).forEach((element) =>
        collectBindings(element, names),
      );
      return;
    case 'AssignmentPattern':
      collectBindings(estree['left'], names);
      return;
    case 'RestElement':
      collectBindings(estree['argument'], names);
      return;
    default:
      return;
  }
}

/** Names the document binds itself with MDX `import` and `export`. */
function documentBindings(tree: PostkitDirectiveNode): Set<string> {
  const names = new Set<string>();
  for (const child of tree.children ?? []) {
    if (child.type !== 'mdxjsEsm') {
      continue;
    }
    const program = child.data?.['estree'] as { body?: unknown[] } | undefined;
    if (program?.body) {
      program.body.forEach((statement) => collectBindings(statement, names));
    } else {
      // Without a parsed program, accept every identifier the block mentions.
      for (const [identifier] of (child.value ?? '').matchAll(
        /[A-Za-z_$][\w$]*/g,
      )) {
        names.add(identifier);
      }
    }
  }
  return names;
}

/**
 * Remark-compatible transformer for Postkit directives. Pair it with a
 * directive parser (for example `remark-directive`) before this plugin.
 *
 * - A Postkit directive becomes its component, with validated literal props.
 * - A directive that isn't a Postkit component and doesn't use the
 *   `postkit-` prefix is put back as the text the author wrote, so "4.5:1"
 *   and "10:30" stay text. Directives already handled by an earlier plugin
 *   (they carry `data.hName`) are left alone.
 * - An unknown `postkit-*` directive or MDX component fails in strict mode
 *   and is a warning otherwise. Errors are `VFileMessage`s with the file and
 *   position.
 */
export function remarkPostkit(options: RemarkPostkitOptions = {}) {
  const resolved: ResolvedOptions = {
    output: options.output ?? 'mdx',
    strict: options.strict ?? true,
    components: new Set(options.components ?? []),
  };

  return (tree: PostkitDirectiveNode, file?: PostkitVFileLike): void => {
    visitChildren(tree, {
      options: resolved,
      file,
      source: readSource(file),
      boundNames: documentBindings(tree),
    });
  };
}

export function isPostkitComponentName(
  value: string,
): value is PostkitComponentName {
  return Object.prototype.hasOwnProperty.call(
    postkitDeclarationManifest.components,
    value,
  );
}
