import {
  POSTKIT_DOCUMENT_VERSION,
  type PostkitAttributeValue,
  type PostkitComponentNode,
  type PostkitDocument,
  type PostkitElementNode,
  type PostkitNode,
} from './document.js';
import { PostkitParseError } from './parse-error.js';
import { parsePostkitMarkdown } from './parse-markdown.js';
import {
  serializePostkitText,
  type SerializePostkitTextOptions,
} from './serialize-text.js';
import {
  escapeHtml,
  resolvePostkitUrl,
  safePostkitUrl,
} from './serialize-url.js';
import {
  renderPostkitStaticView,
  type PostkitStaticViewOptions,
  type PostkitViewAttributeValue,
  type PostkitViewElement,
  type PostkitViewNode,
} from './serialize-views.js';

export type PostkitOutputFormat = 'html' | 'json' | 'markdown' | 'mdx' | 'text';

export interface SerializePostkitHtmlOptions extends PostkitStaticViewOptions {
  /** Include versioned reconstruction annotations. Defaults to true. */
  readonly annotations?: boolean;
  /** Optional document wrapper. Serialization is wrapper-free by default. */
  readonly documentElement?: string | false;
  /**
   * Element used to carry annotated custom component nodes. Defaults to
   * `div`. Built-in components render their static view instead.
   */
  readonly componentElement?: string | ((node: PostkitComponentNode) => string);
}

export interface SerializePostkitJsonOptions {
  readonly space?: number | string;
}

export interface SerializePostkitMarkdownOptions {
  /** Emit literal, non-executable MDX tags for component nodes. */
  readonly mdx?: boolean;
  /** Annotate HTML fallbacks so their structure can be recovered. */
  readonly annotations?: boolean;
}

export interface SerializePostkitOptions {
  readonly format: PostkitOutputFormat;
  readonly html?: SerializePostkitHtmlOptions;
  readonly json?: SerializePostkitJsonOptions;
  readonly markdown?: SerializePostkitMarkdownOptions;
  readonly text?: SerializePostkitTextOptions;
}

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const unsafeElements = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
  'template',
]);

const htmlAttributeNames: Readonly<Record<string, string>> = {
  classname: 'class',
  colSpan: 'colspan',
  dateTime: 'datetime',
  formAction: 'formaction',
  rowSpan: 'rowspan',
  srcSet: 'srcset',
};

const allowedHtmlAttributes = new Set([
  'alt',
  'checked',
  'cite',
  'class',
  'colspan',
  'controls',
  'datetime',
  'disabled',
  'height',
  'hidden',
  'href',
  'id',
  'kind',
  'label',
  'language',
  'loading',
  'loop',
  'meta',
  'muted',
  'open',
  'poster',
  'preload',
  'rel',
  'reversed',
  'role',
  'rowspan',
  'scope',
  'sizes',
  'span',
  'src',
  'srcset',
  'start',
  'title',
  'type',
  'value',
  'width',
]);

function assertDocument(document: PostkitDocument): void {
  if (
    document.type !== 'document' ||
    document.version !== POSTKIT_DOCUMENT_VERSION
  ) {
    throw new PostkitParseError(
      'invalid-document',
      `Postkit output requires a version ${POSTKIT_DOCUMENT_VERSION} document.`,
    );
  }
}

function safeElementName(name: string): string {
  const normalized = name.toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(normalized) || unsafeElements.has(normalized)) {
    throw new PostkitParseError(
      'invalid-document',
      `Unsafe HTML element name: ${name}.`,
    );
  }
  return normalized;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function safeUrlAttribute(name: string, value: PostkitAttributeValue): boolean {
  if (name === 'srcset') {
    return (
      typeof value === 'string' &&
      value.split(',').every((candidate) => {
        const [url, ...descriptors] = candidate.trim().split(/\s+/);
        return (
          !!url &&
          safeUrlAttribute('src', url) &&
          descriptors.length <= 1 &&
          descriptors.every((descriptor) =>
            /^(?:\d+(?:\.\d+)?x|\d+w)$/.test(descriptor),
          )
        );
      })
    );
  }
  if (!['cite', 'href', 'poster', 'src'].includes(name)) return true;
  if (typeof value !== 'string') return false;
  const normalized = [...value.trim()]
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('')
    .toLowerCase();
  const scheme = normalized.match(/^([a-z][a-z0-9+.-]*):/)?.[1];
  return !scheme || ['http', 'https', 'mailto', 'tel'].includes(scheme);
}

function serializeAttribute(
  name: string,
  value: PostkitAttributeValue,
  baseUrl: string | undefined,
): string {
  const normalized = name.toLowerCase();
  const htmlName = htmlAttributeNames[normalized] ?? normalized;
  if (
    (!allowedHtmlAttributes.has(htmlName) &&
      !/^aria-[a-z-]+$/.test(htmlName)) ||
    !safeUrlAttribute(htmlName, value)
  ) {
    return '';
  }
  if (value === false) return '';
  if (value === true) return ` ${htmlName}`;
  const serialized = Array.isArray(value)
    ? value.join(' ')
    : urlAttributes.has(htmlName)
      ? resolvePostkitUrl(String(value), baseUrl)
      : htmlName === 'srcset'
        ? resolveSrcset(String(value), baseUrl)
        : String(value);
  return ` ${htmlName}="${escapeAttribute(serialized)}"`;
}

const urlAttributes = new Set(['cite', 'href', 'poster', 'src']);

function resolveSrcset(value: string, baseUrl: string | undefined): string {
  if (!baseUrl) return value;
  return value
    .split(',')
    .map((candidate) => {
      const [url = '', ...descriptors] = candidate.trim().split(/\s+/);
      return [resolvePostkitUrl(url, baseUrl), ...descriptors].join(' ');
    })
    .join(', ');
}

function serializeAttributes(
  attributes: Readonly<Record<string, PostkitAttributeValue>> | undefined,
  baseUrl: string | undefined,
): string {
  return Object.entries(attributes ?? {})
    .map(([name, value]) => serializeAttribute(name, value, baseUrl))
    .join('');
}

/**
 * An attribute a static view sets. Views use fixed names, but their values
 * come from props, so URLs are checked again (http, https, mailto or
 * relative only) and resolved against `baseUrl`.
 */
function serializeViewAttribute(
  name: string,
  value: PostkitViewAttributeValue,
  baseUrl: string | undefined,
): string {
  if (value === undefined || value === false) return '';
  if (!/^[a-z][a-z-]*$/.test(name)) return '';
  if (value === true) return ` ${name}`;
  let serialized = String(value);
  if (urlAttributes.has(name)) {
    const url = safePostkitUrl(serialized, baseUrl);
    if (url === undefined) return '';
    serialized = url;
  } else if (name === 'srcset') {
    if (!safeUrlAttribute('srcset', serialized)) return '';
    const candidates = serialized.split(',').map((candidate) => {
      const [url = '', ...descriptors] = candidate.trim().split(/\s+/);
      return [safePostkitUrl(url, baseUrl), ...descriptors];
    });
    if (candidates.some(([url]) => url === undefined)) return '';
    serialized = candidates.map((candidate) => candidate.join(' ')).join(', ');
  }
  return ` ${name}="${escapeAttribute(serialized)}"`;
}

interface StaticViewContext {
  readonly node: PostkitComponentNode;
  readonly options: SerializePostkitHtmlOptions;
  readonly markdown: boolean;
}

function serializeViewNode(
  node: PostkitViewNode,
  context: StaticViewContext,
  root = false,
): string {
  if (node.type === 'slot') {
    return context.node.children
      .map((child) =>
        serializeHtmlNode(child, context.options, false, context.markdown),
      )
      .join('');
  }
  if (node.type === 'text') {
    const text = escapeHtml(node.value);
    // Inside Markdown, a blank line would end the HTML block early.
    return context.markdown ? text.replaceAll('\n', '&#10;') : text;
  }
  return serializeViewElement(node, context, root);
}

function serializeViewElement(
  element: PostkitViewElement,
  context: StaticViewContext,
  root: boolean,
): string {
  const { node, options } = context;
  const annotated = options.annotations !== false;
  const name = safeElementName(element.name);
  const attributes = [
    root ? ` data-postkit-component="${escapeAttribute(node.name)}"` : '',
    element.part ? ` data-postkit-part="${escapeAttribute(element.part)}"` : '',
    ...Object.entries(element.attributes ?? {}).map(([key, value]) =>
      serializeViewAttribute(key, value, options.baseUrl),
    ),
    root && annotated ? reconstructionAnnotations(node, 'static') : '',
    annotated && element.children.some((child) => child.type === 'slot')
      ? ' data-postkit-slot="children"'
      : '',
  ].join('');
  if (voidElements.has(name)) return `<${name}${attributes}>`;
  return `<${name}${attributes}>${element.children
    .map((child) => serializeViewNode(child, context))
    .join('')}</${name}>`;
}

function reconstructionAnnotations(
  node: PostkitComponentNode,
  view?: 'omitted' | 'static',
): string {
  return ` data-postkit-version="${POSTKIT_DOCUMENT_VERSION}"${
    node.props && Object.keys(node.props).length > 0
      ? ` data-postkit-props="${escapeAttribute(JSON.stringify(node.props))}"`
      : ''
  }${view ? ` data-postkit-view="${view}"` : ''}`;
}

/**
 * A built-in component as its static view: readable markup with the anatomy
 * attributes. With annotations, the root also carries the props and marks the
 * view (`data-postkit-view`), and the element holding the authored children is
 * marked `data-postkit-slot`, so the parser drops the generated markup and
 * recovers the component node exactly. Returns `undefined` for components
 * without a view.
 */
function serializeStaticView(
  node: PostkitComponentNode,
  options: SerializePostkitHtmlOptions,
  markdown: boolean,
): string | undefined {
  const view = renderPostkitStaticView(node, options);
  if (!view) return undefined;
  const context: StaticViewContext = { node, options, markdown };
  if (view.kind === 'view') return serializeViewNode(view.root, context, true);
  // Nothing to show statically. Annotated output keeps a hidden carrier so the
  // component survives a round trip.
  if (options.annotations === false) return '';
  const children =
    node.children.length > 0
      ? `<div data-postkit-slot="children">${serializeViewNode({ type: 'slot' }, context)}</div>`
      : '';
  return `<div data-postkit-component="${escapeAttribute(node.name)}" data-postkit-part="root"${reconstructionAnnotations(node, 'omitted')} hidden>${children}</div>`;
}

function componentElement(
  node: PostkitComponentNode,
  option: SerializePostkitHtmlOptions['componentElement'],
): string {
  return safeElementName(
    typeof option === 'function' ? option(node) : (option ?? 'div'),
  );
}

function serializeHtmlNode(
  node: PostkitNode,
  options: SerializePostkitHtmlOptions,
  mdx = false,
  markdown = mdx,
): string {
  if (node.type === 'text')
    return mdx ? escapeMdxText(escapeHtml(node.value)) : escapeHtml(node.value);
  if (node.type === 'component') {
    if (!/^[A-Z][A-Za-z0-9.]*$/.test(node.name)) {
      throw new PostkitParseError(
        'invalid-document',
        `Invalid Postkit component name: ${node.name}.`,
      );
    }
    // MDX keeps literal component carriers: an MDX renderer supplies the view.
    const view = mdx ? undefined : serializeStaticView(node, options, markdown);
    if (view !== undefined) return view;
    const name = componentElement(node, options.componentElement);
    const annotations =
      options.annotations === false
        ? ''
        : ` data-postkit-component="${escapeAttribute(node.name)}"${reconstructionAnnotations(node)}`;
    return `<${name}${annotations}>${node.children
      .map((child) => serializeHtmlNode(child, options, mdx, markdown))
      .join('')}</${name}>`;
  }
  const name = safeElementName(node.name);
  const checked = name === 'li' ? node.attributes?.['checked'] : undefined;
  const isTask = typeof checked === 'boolean';
  const attributes = isTask
    ? Object.fromEntries(
        Object.entries(node.attributes ?? {}).filter(
          ([key]) => key !== 'checked',
        ),
      )
    : node.attributes;
  const annotations =
    options.annotations === false
      ? ''
      : ` data-postkit-node="${name}" data-postkit-version="${POSTKIT_DOCUMENT_VERSION}"`;
  const opening = `<${name}${serializeAttributes(attributes, options.baseUrl)}${annotations}>`;
  if (voidElements.has(name))
    return mdx ? `${opening.slice(0, -1)} />` : opening;
  const checkbox = isTask
    ? serializeHtmlNode(
        {
          type: 'element',
          name: 'input',
          attributes: {
            type: 'checkbox',
            checked,
            disabled: true,
            'aria-label': checked ? 'Completed' : 'Not completed',
          },
          children: [],
        },
        { annotations: false },
        mdx,
      )
    : '';
  return `${opening}${checkbox}${node.children
    .map((child) => serializeHtmlNode(child, options, mdx, markdown))
    .join('')}</${name}>`;
}

export function serializePostkitHtml(
  document: PostkitDocument,
  options: SerializePostkitHtmlOptions = {},
): string {
  assertDocument(document);
  const body = document.children
    .map((node) => serializeHtmlNode(node, options))
    .join('');
  if (
    options.documentElement === false ||
    options.documentElement === undefined
  ) {
    return body;
  }
  const name = safeElementName(options.documentElement);
  const annotations =
    options.annotations === false
      ? ''
      : ` data-postkit-document="" data-postkit-version="${POSTKIT_DOCUMENT_VERSION}"`;
  return `<${name}${annotations}>${body}</${name}>`;
}

export function serializePostkitJson(
  document: PostkitDocument,
  options: SerializePostkitJsonOptions = {},
): string {
  assertDocument(document);
  return JSON.stringify(document, null, options.space);
}

function textContent(nodes: readonly PostkitNode[]): string {
  return nodes
    .map((node) =>
      node.type === 'text' ? node.value : textContent(node.children),
    )
    .join('');
}

function escapeMdxText(value: string): string {
  return value
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;')
    .replace(
      /^(\s*)(import|export)(?=\s|$)/gm,
      (_, space: string, keyword: string) =>
        `${space}&#${keyword.charCodeAt(0)};${keyword.slice(1)}`,
    );
}

function escapeMarkdown(
  value: string,
  options: SerializePostkitMarkdownOptions,
): string {
  // Escape text independently of its neighbors: a text node may begin a
  // block, follow a line break, or sit beside another inline node.
  const escaped = value
    .replaceAll('&', '&amp;')
    .replace(/([\\`*_[\]<>#+.!~|=-])/g, '\\$1')
    .replace(/^(?: {4,}| *\t)[ \t]*/gm, (space) =>
      [...space].map((character) => `&#${character.charCodeAt(0)};`).join(''),
    );
  return options.mdx ? escapeMdxText(escaped) : escaped;
}

function inlineCode(value: string): string {
  const longest = Math.max(
    0,
    ...[...value.matchAll(/`+/g)].map((match) => match[0].length),
  );
  const fence = '`'.repeat(Math.max(1, longest + 1));
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${value}${padding}${fence}`;
}

function mdxComponent(
  node: PostkitComponentNode,
  options: SerializePostkitMarkdownOptions,
  inline = false,
): string {
  if (!/^[A-Z][A-Za-z0-9.]*$/.test(node.name)) {
    throw new PostkitParseError(
      'invalid-document',
      `Invalid Postkit component name: ${node.name}.`,
    );
  }
  const props =
    node.props && Object.keys(node.props).length > 0
      ? ` data-postkit-props="${escapeAttribute(JSON.stringify(node.props))}"`
      : '';
  if (node.children.length === 0) return `<${node.name}${props} />`;
  if (inline) {
    return `<${node.name}${props}>${node.children.map((child) => serializeInlineNode(child, options)).join('')}</${node.name}>`;
  }
  const children = serializeMarkdownNodes(node.children, options).trim();
  return `<${node.name}${props}>\n\n${children}\n\n</${node.name}>`;
}

function htmlFallback(
  node: PostkitNode,
  options: SerializePostkitMarkdownOptions,
): string {
  return serializeHtmlNode(
    node,
    {
      annotations: options.annotations,
    },
    options.mdx,
    true,
  );
}

function serializeInlineNode(
  node: PostkitNode,
  options: SerializePostkitMarkdownOptions,
): string {
  if (node.type === 'text') return escapeMarkdown(node.value, options);
  if (node.type === 'component') {
    return options.mdx
      ? mdxComponent(node, options, true)
      : htmlFallback(node, options);
  }
  const children = () =>
    node.children.map((child) => serializeInlineNode(child, options)).join('');
  switch (node.name) {
    case 'strong':
    case 'b':
      return `**${children()}**`;
    case 'em':
    case 'i':
      return `*${children()}*`;
    case 'del':
    case 's':
      return `~~${children()}~~`;
    case 'code':
      return inlineCode(textContent(node.children));
    case 'a': {
      const href = node.attributes?.['href'];
      const title = node.attributes?.['title'];
      if (typeof href !== 'string') return children();
      return `[${children()}](${escapeMarkdownDestination(href)}${
        typeof title === 'string' ? ` "${escapeMarkdownTitle(title)}"` : ''
      })`;
    }
    case 'img': {
      const src = node.attributes?.['src'];
      const alt = node.attributes?.['alt'];
      const title = node.attributes?.['title'];
      if (typeof src !== 'string') return '';
      return `![${typeof alt === 'string' ? escapeMarkdown(alt, options) : ''}](${escapeMarkdownDestination(src)}${
        typeof title === 'string' ? ` "${escapeMarkdownTitle(title)}"` : ''
      })`;
    }
    case 'br':
      return '  \n';
    default:
      return htmlFallback(node, options);
  }
}

function escapeMarkdownDestination(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replace(/([\\()<>])/g, '\\$1')
    .replace(/\s/g, (character) => `&#${character.charCodeAt(0)};`);
}

function escapeMarkdownTitle(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replace(/([\\"])/g, '\\$1')
    .replace(/[\r\n]/g, (character) => `&#${character.charCodeAt(0)};`);
}

function serializeList(
  node: PostkitElementNode,
  options: SerializePostkitMarkdownOptions,
): string {
  const ordered = node.name === 'ol';
  const start =
    ordered && typeof node.attributes?.['start'] === 'number'
      ? node.attributes['start']
      : 1;
  return node.children
    .filter(
      (child): child is PostkitElementNode =>
        child.type === 'element' && child.name === 'li',
    )
    .map((item, index) => {
      const marker = ordered ? `${start + index}.` : '-';
      const checked = item.attributes?.['checked'];
      const task =
        typeof checked === 'boolean' ? `[${checked ? 'x' : ' '}] ` : '';
      const content = serializeMarkdownNodes(item.children, options).trim();
      const lines = content.split('\n');
      return `${marker} ${task}${lines[0] ?? ''}${lines
        .slice(1)
        .map((line) => `\n   ${line}`)
        .join('')}`;
    })
    .join('\n');
}

function tableRows(node: PostkitElementNode): PostkitElementNode[] {
  const sections = node.children.filter(
    (child): child is PostkitElementNode =>
      child.type === 'element' &&
      ['thead', 'tbody', 'tfoot'].includes(child.name),
  );
  const rowParents = sections.length > 0 ? sections : [node];
  return rowParents.flatMap((parent) =>
    parent.children.filter(
      (child): child is PostkitElementNode =>
        child.type === 'element' && child.name === 'tr',
    ),
  );
}

function serializeTable(
  node: PostkitElementNode,
  options: SerializePostkitMarkdownOptions,
): string {
  const rows = tableRows(node).map((row) =>
    row.children
      .filter(
        (cell): cell is PostkitElementNode =>
          cell.type === 'element' && ['td', 'th'].includes(cell.name),
      )
      .map((cell) =>
        cell.children
          .map((child) => serializeInlineNode(child, options))
          .join('')
          .replaceAll('|', '\\|')
          .replaceAll('\n', options.mdx ? '<br />' : '<br>'),
      ),
  );
  if (rows.length === 0) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [
    ...row,
    ...Array.from({ length: width - row.length }, () => ''),
  ]);
  const line = (cells: readonly string[]) => `| ${cells.join(' | ')} |`;
  return [
    line(normalized[0] ?? []),
    line(Array.from({ length: width }, () => '---')),
    ...normalized.slice(1).map(line),
  ].join('\n');
}

function serializeCodeBlock(node: PostkitElementNode): string {
  const codeNode = node.children.find(
    (child): child is PostkitElementNode =>
      child.type === 'element' && child.name === 'code',
  );
  const value = textContent(codeNode?.children ?? node.children);
  const longest = Math.max(
    0,
    ...[...value.matchAll(/`+/g)].map((match) => match[0].length),
  );
  const fence = '`'.repeat(Math.max(3, longest + 1));
  const language = codeNode?.attributes?.['language'];
  const meta = codeNode?.attributes?.['meta'];
  const info = [language, meta]
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .replace(/[\r\n`]/g, ' ');
  return `${fence}${info}\n${value.replace(/\n$/, '')}\n${fence}`;
}

function serializeBlockNode(
  node: PostkitNode,
  options: SerializePostkitMarkdownOptions,
): string {
  if (node.type === 'text') return escapeMarkdown(node.value, options);
  if (node.type === 'component') {
    return options.mdx
      ? mdxComponent(node, options)
      : htmlFallback(node, options);
  }
  const inlineChildren = () =>
    node.children.map((child) => serializeInlineNode(child, options)).join('');
  switch (node.name) {
    case 'p':
      return inlineChildren();
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return `${'#'.repeat(Number(node.name[1]))} ${inlineChildren()}`;
    case 'blockquote':
      return serializeMarkdownNodes(node.children, options)
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'ul':
    case 'ol':
      return serializeList(node, options);
    case 'pre':
      return serializeCodeBlock(node);
    case 'hr':
      return '---';
    case 'table':
      return serializeTable(node, options);
    default:
      return htmlFallback(node, options);
  }
}

function serializeMarkdownNodes(
  nodes: readonly PostkitNode[],
  options: SerializePostkitMarkdownOptions,
): string {
  return nodes.map((node) => serializeBlockNode(node, options)).join('\n\n');
}

export function serializePostkitMarkdown(
  document: PostkitDocument,
  options: SerializePostkitMarkdownOptions = {},
): string {
  assertDocument(document);
  const content = serializeMarkdownNodes(document.children, options).trimEnd();
  // Fail closed if a future serializer branch accidentally emits executable
  // syntax. The safe parser rejects expressions, spreads, and ESM everywhere.
  if (options.mdx) parsePostkitMarkdown(content, { mdx: true });
  return content.length > 0 ? `${content}\n` : '';
}

export function serializePostkitMdx(
  document: PostkitDocument,
  options: Omit<SerializePostkitMarkdownOptions, 'mdx'> = {},
): string {
  return serializePostkitMarkdown(document, { ...options, mdx: true });
}

export function serializePostkit(
  document: PostkitDocument,
  options: SerializePostkitOptions,
): string {
  switch (options.format) {
    case 'html':
      return serializePostkitHtml(document, options.html);
    case 'json':
      return serializePostkitJson(document, options.json);
    case 'markdown':
      return serializePostkitMarkdown(document, options.markdown);
    case 'mdx':
      return serializePostkitMdx(document, options.markdown);
    case 'text':
      return serializePostkitText(document, options.text);
    default:
      throw new PostkitParseError(
        'unsupported-format',
        `Unsupported Postkit output format: ${String(options.format)}.`,
      );
  }
}
