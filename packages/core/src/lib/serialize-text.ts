import {
  POSTKIT_DOCUMENT_VERSION,
  type PostkitDocument,
  type PostkitNode,
} from './document.js';
import { PostkitParseError } from './parse-error.js';
import {
  createPostkitFootnoteContext,
  postkitFootnoteFor,
  postkitFootnoteMark,
  type PostkitFootnoteRenderContext,
} from './serialize-footnotes.js';
import { safePostkitUrl } from './serialize-url.js';
import {
  renderPostkitStaticView,
  type PostkitStaticViewOptions,
  type PostkitViewNode,
} from './serialize-views.js';

/**
 * Options for {@link serializePostkitText}. They are the static-view options
 * the HTML serializer takes too: `baseUrl`, `audiences` and `newsletterUrl`.
 */
export type SerializePostkitTextOptions = PostkitStaticViewOptions;

type TextNode = PostkitNode | PostkitViewNode;
type TextElement = Extract<TextNode, { readonly type: 'element' }>;

/** The authored children a view's slot stands for, and the scope they came from. */
interface Scope {
  readonly children: readonly PostkitNode[];
  readonly outer: Scope | undefined;
}

interface Context {
  readonly options: SerializePostkitTextOptions;
  /** The document's numbered notes, when it has any. */
  readonly footnotes?: PostkitFootnoteRenderContext;
}

const blockElements = new Set([
  'address',
  'article',
  'aside',
  'audio',
  'caption',
  'dd',
  'details',
  'div',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'li',
  'main',
  'nav',
  'p',
  'section',
  'summary',
  'video',
]);

/** Elements whose content is never reader text. */
const skippedElements = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'source',
  'style',
  'template',
  'track',
]);

/** Collects inline text into paragraphs ("blocks"). */
class TextWriter {
  readonly blocks: string[] = [];
  inline = '';
  flushes = 0;

  /** Text in normal flow: whitespace collapses, as in HTML. */
  text(value: string): void {
    this.inline += value.replace(/\s+/g, ' ');
  }

  /** A hard line break. */
  lineBreak(): void {
    this.inline += '\n';
  }

  /** Ends the current paragraph. */
  flush(): void {
    const text = this.inline
      .split('\n')
      .map((line) => line.replace(/ +/g, ' ').trim())
      .join('\n')
      .trim();
    if (text) this.blocks.push(text);
    this.inline = '';
    this.flushes += 1;
  }

  /** A finished block, kept exactly (code keeps its indentation). */
  block(text: string): void {
    this.flush();
    if (text.trim()) this.blocks.push(text);
  }
}

function attribute(node: TextElement, name: string): unknown {
  for (const [key, value] of Object.entries(node.attributes ?? {})) {
    if (key.toLowerCase() === name) return value;
  }
  return undefined;
}

function elementChildren(node: TextElement): TextElement[] {
  return (node.children as readonly TextNode[]).filter(
    (child): child is TextElement => child.type === 'element',
  );
}

function renderBlocks(
  nodes: readonly TextNode[],
  context: Context,
  scope: Scope | undefined,
): string[] {
  const writer = new TextWriter();
  for (const node of nodes) visit(node, writer, context, scope);
  writer.flush();
  return writer.blocks;
}

/** Literal text, for code: line breaks and indentation stay. */
function rawText(
  nodes: readonly TextNode[],
  context: Context,
  scope: Scope | undefined,
): string {
  return nodes
    .map((node): string => {
      switch (node.type) {
        case 'text':
          return node.value;
        case 'footnoteReference':
        case 'footnoteDefinition':
          return '';
        case 'slot':
          return rawText(scope?.children ?? [], context, scope?.outer);
        case 'component': {
          const view = renderPostkitStaticView(node, context.options);
          if (!view) return rawText(node.children, context, scope);
          return view.kind === 'view'
            ? rawText([view.root], context, {
                children: node.children,
                outer: scope,
              })
            : '';
        }
        default:
          if (skippedElements.has(node.name.toLowerCase())) return '';
          return node.name.toLowerCase() === 'br'
            ? '\n'
            : rawText(node.children, context, scope);
      }
    })
    .join('');
}

function visit(
  node: TextNode,
  writer: TextWriter,
  context: Context,
  scope: Scope | undefined,
): void {
  switch (node.type) {
    case 'text':
      writer.text(node.value);
      return;
    case 'footnoteReference': {
      // `[1]` marks (03 §7.1); the notes follow as a numbered list.
      const note =
        context.footnotes && postkitFootnoteFor(context.footnotes, node);
      writer.text(
        note && context.footnotes
          ? ` [${postkitFootnoteMark(context.footnotes, note)}]`
          : ` [${node.label ?? node.identifier}]`,
      );
      return;
    }
    case 'footnoteDefinition':
      // Listed with the other notes.
      return;
    case 'slot':
      for (const child of scope?.children ?? []) {
        visit(child, writer, context, scope?.outer);
      }
      return;
    case 'component': {
      if (node.name === 'Footnotes' && context.footnotes) {
        writeFootnotes(writer, context);
        return;
      }
      const view = renderPostkitStaticView(node, context.options);
      if (!view) {
        // A custom component: its authored content is the readable part.
        writer.flush();
        for (const child of node.children) visit(child, writer, context, scope);
        writer.flush();
        return;
      }
      if (view.kind === 'view') {
        visit(view.root, writer, context, {
          children: node.children,
          outer: scope,
        });
      }
      return;
    }
    default:
      visitElement(node, writer, context, scope);
  }
}

function prefixLines(text: string, first: string, rest: string): string {
  return text
    .split('\n')
    .map((line, index) =>
      `${index === 0 ? first : rest}${line}`.replace(/\s+$/, ''),
    )
    .join('\n');
}

function visitElement(
  node: TextElement,
  writer: TextWriter,
  context: Context,
  scope: Scope | undefined,
): void {
  const name = node.name.toLowerCase();
  if (skippedElements.has(name) || attribute(node, 'hidden') === true) return;
  const children = node.children as readonly TextNode[];
  switch (name) {
    case 'br':
      writer.lineBreak();
      return;
    case 'hr':
      writer.block('---');
      return;
    case 'img': {
      const alt = attribute(node, 'alt');
      if (typeof alt === 'string' && alt.trim()) writer.text(`[${alt.trim()}]`);
      return;
    }
    case 'input':
      if (attribute(node, 'type') === 'checkbox') {
        writer.text(attribute(node, 'checked') === true ? '[x] ' : '[ ] ');
      }
      return;
    case 'a': {
      const value = attribute(node, 'href');
      const href =
        typeof value === 'string'
          ? safePostkitUrl(value, context.options.baseUrl)
          : undefined;
      const start = writer.inline.length;
      const flushes = writer.flushes;
      for (const child of children) visit(child, writer, context, scope);
      if (!href || href.startsWith('#')) return;
      const label =
        writer.flushes === flushes
          ? writer.inline.slice(start).replace(/\s+/g, ' ').trim()
          : undefined;
      if (!label) {
        writer.text(label === undefined ? ` (${href})` : href);
      } else if (label !== href && `mailto:${label}` !== href) {
        writer.text(` (${href})`);
      }
      return;
    }
    case 'pre':
      writer.block(rawText(children, context, scope).replace(/\n$/, ''));
      return;
    case 'ul':
    case 'ol': {
      const start = Number(attribute(node, 'start'));
      const first = name === 'ol' && Number.isInteger(start) ? start : 1;
      const items = elementChildren(node)
        .filter((child) => child.name.toLowerCase() === 'li')
        .map((item, index) => {
          const marker = name === 'ol' ? `${first + index}.` : '-';
          const checked = attribute(item, 'checked');
          const task =
            typeof checked === 'boolean' ? `[${checked ? 'x' : ' '}] ` : '';
          const body = renderBlocks(
            item.children as readonly TextNode[],
            context,
            scope,
          ).join('\n');
          return prefixLines(
            `${task}${body}`,
            `${marker} `,
            ' '.repeat(marker.length + 1),
          );
        });
      writer.block(items.join('\n'));
      return;
    }
    case 'blockquote':
      writer.block(
        prefixLines(
          renderBlocks(children, context, scope).join('\n\n'),
          '> ',
          '> ',
        ),
      );
      return;
    case 'table': {
      const rows: TextElement[] = [];
      const collect = (parent: TextElement) => {
        for (const child of elementChildren(parent)) {
          const childName = child.name.toLowerCase();
          if (childName === 'tr') rows.push(child);
          else if (['thead', 'tbody', 'tfoot'].includes(childName)) {
            collect(child);
          }
        }
      };
      collect(node);
      writer.block(
        rows
          .map((row) =>
            elementChildren(row)
              .filter((cell) => ['td', 'th'].includes(cell.name.toLowerCase()))
              .map((cell) =>
                renderBlocks(
                  cell.children as readonly TextNode[],
                  context,
                  scope,
                ).join(' '),
              )
              .join(' | '),
          )
          .join('\n'),
      );
      return;
    }
    case 'dl': {
      // `Label: value`, then any further descriptions on their own lines.
      const lines: string[] = [];
      let term = false;
      for (const child of elementChildren(node)) {
        const childName = child.name.toLowerCase();
        if (childName !== 'dt' && childName !== 'dd') continue;
        const text = renderBlocks(
          child.children as readonly TextNode[],
          context,
          scope,
        ).join(' ');
        if (childName === 'dd' && term && lines.length > 0) {
          lines[lines.length - 1] += `: ${text}`;
        } else {
          lines.push(text);
        }
        term = childName === 'dt';
      }
      writer.block(lines.join('\n'));
      return;
    }
  }
  const block = blockElements.has(name);
  if (block) writer.flush();
  for (const child of children) visit(child, writer, context, scope);
  if (block) writer.flush();
}

/** `[1] Note text`, one note per line, where the list is placed or at the end. */
function writeFootnotes(writer: TextWriter, context: Context): void {
  const footnotes = context.footnotes;
  if (!footnotes || footnotes.rendered) return;
  footnotes.rendered = true;
  const lines = footnotes.resolution.notes.flatMap((note) => {
    if (!note.definition) return [];
    const text = renderBlocks(note.definition.children, context, undefined)
      .join(' ')
      .replace(/\s*\n\s*/g, ' ');
    return [`[${postkitFootnoteMark(footnotes, note)}] ${text}`];
  });
  if (lines.length > 0) writer.block(lines.join('\n'));
}

/**
 * Writes a document as readable plain text, for email text parts and `llms`
 * files. Paragraphs are separated by blank lines, lists keep their markers,
 * links show their URL, and built-in components use the same static views as
 * `serializePostkitHtml`, so prop-carried text (titles, captions,
 * attributions) appears as text.
 */
export function serializePostkitText(
  document: PostkitDocument,
  options: SerializePostkitTextOptions = {},
): string {
  if (
    document.type !== 'document' ||
    document.version !== POSTKIT_DOCUMENT_VERSION
  ) {
    throw new PostkitParseError(
      'invalid-document',
      `Postkit output requires a version ${POSTKIT_DOCUMENT_VERSION} document.`,
    );
  }
  const footnotes = createPostkitFootnoteContext(document, options.footnotes);
  const context: Context = { options, ...(footnotes ? { footnotes } : {}) };
  const writer = new TextWriter();
  for (const node of document.children) {
    visit(node, writer, context, undefined);
  }
  writeFootnotes(writer, context);
  writer.flush();
  const text = writer.blocks.join('\n\n');
  return text ? `${text}\n` : '';
}
