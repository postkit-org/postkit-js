import {
  formatPostkitFootnoteNumber,
  postkitFootnoteBacklinkLabel,
  postkitFootnoteIds,
  postkitFootnoteMarkers,
  postkitFootnoteNumberings,
  type PostkitFootnoteMarker,
  type PostkitFootnoteNumbering,
} from '../components/footnote/footnote.model.js';
import {
  POSTKIT_DOCUMENT_VERSION,
  type PostkitComponentNode,
  type PostkitDocument,
  type PostkitFootnoteDefinitionNode,
  type PostkitFootnoteReferenceNode,
  type PostkitNode,
} from './document.js';
import {
  normalizePostkitFootnoteIdentifier,
  resolvePostkitFootnotes,
  type PostkitFootnoteResolution,
  type PostkitResolvedFootnote,
} from './footnotes.js';
import { escapeHtml } from './serialize-url.js';
import type { PostkitStaticFootnoteOptions } from './serialize-views.js';

/** @internal How a serializer renders one document's footnotes. */
export interface PostkitFootnoteRenderContext {
  readonly resolution: PostkitFootnoteResolution;
  readonly scope: string | undefined;
  readonly numbering: PostkitFootnoteNumbering;
  readonly marker: PostkitFootnoteMarker;
  readonly title: string | false;
  readonly links: boolean;
  readonly backlinks: boolean;
  /** The props of the placed `Footnotes` component, for round trips. */
  readonly listProps: Readonly<Record<string, unknown>> | undefined;
  /** References seen so far, per note, for `fnref-…-2` ids. */
  readonly occurrences: Map<string, number>;
  /** Whether the list has been written. */
  rendered: boolean;
}

function oneOf<Value extends string>(
  values: readonly Value[],
  value: unknown,
): Value | undefined {
  return values.includes(value as Value) ? (value as Value) : undefined;
}

/**
 * @internal Numbers a document's notes and settles how they render: the
 * placed `Footnotes` component's props win over the serializer's options.
 * Returns `undefined` when the document has no notes.
 */
export function createPostkitFootnoteContext(
  document: PostkitDocument,
  options: PostkitStaticFootnoteOptions = {},
): PostkitFootnoteRenderContext | undefined {
  const resolution = resolvePostkitFootnotes(document);
  if (resolution.notes.length === 0 && !resolution.list) return undefined;
  const props = resolution.list?.props ?? {};
  const title = props['title'];
  return {
    resolution,
    scope: typeof props['scope'] === 'string' ? props['scope'] : options.scope,
    numbering:
      oneOf(postkitFootnoteNumberings, props['numbering']) ??
      options.numbering ??
      'decimal',
    marker:
      oneOf(postkitFootnoteMarkers, props['marker']) ??
      options.marker ??
      'superscript',
    title:
      typeof title === 'string' || title === false
        ? title
        : (options.title ?? 'Notes'),
    links: options.links !== false,
    backlinks:
      options.links !== false &&
      props['backlinks'] !== false &&
      props['backlinks'] !== 'false',
    listProps: resolution.list?.props,
    occurrences: new Map(),
    rendered: false,
  };
}

/** @internal The note a reference points to, if the document numbers it. */
export function postkitFootnoteFor(
  context: PostkitFootnoteRenderContext,
  node: PostkitFootnoteReferenceNode | PostkitFootnoteDefinitionNode,
): PostkitResolvedFootnote | undefined {
  return context.resolution.byIdentifier.get(
    normalizePostkitFootnoteIdentifier(node.identifier),
  );
}

/** @internal A note's mark in a context's numbering: `1`, `ii`, `†`. */
export function postkitFootnoteMark(
  context: PostkitFootnoteRenderContext,
  note: PostkitResolvedFootnote,
): string {
  return formatPostkitFootnoteNumber(note.index, context.numbering);
}

function attribute(name: string, value: string | undefined): string {
  if (value === undefined) return '';
  return ` ${name}="${escapeHtml(value).replaceAll('"', '&quot;')}"`;
}

function nodeAnnotations(
  annotated: boolean,
  kind: string,
  node?: PostkitFootnoteReferenceNode | PostkitFootnoteDefinitionNode,
): string {
  if (!annotated) return '';
  return `${attribute('data-postkit-node', kind)}${
    node ? attribute('data-postkit-identifier', node.identifier) : ''
  }${node?.label ? attribute('data-postkit-label', node.label) : ''}${attribute(
    'data-postkit-version',
    String(POSTKIT_DOCUMENT_VERSION),
  )}`;
}

/**
 * @internal A reference: `<sup id="fnref-1"><a href="#fn-1">1</a></sup>`,
 * with the Footnote anatomy. Without links (email), the mark is plain text.
 */
export function postkitFootnoteReferenceHtml(
  context: PostkitFootnoteRenderContext | undefined,
  node: PostkitFootnoteReferenceNode,
  annotated: boolean,
): string {
  const note = context && postkitFootnoteFor(context, node);
  if (!context || !note) {
    // Nothing to number it against: keep it recoverable and readable.
    return `<sup${nodeAnnotations(annotated, 'footnoteReference', node)}>[${escapeHtml(
      node.label ?? node.identifier,
    )}]</sup>`;
  }
  const occurrence = (context.occurrences.get(note.identifier) ?? 0) + 1;
  context.occurrences.set(note.identifier, occurrence);
  const ids = postkitFootnoteIds(note.index, context.scope);
  const mark = postkitFootnoteMark(context, note);
  const text = escapeHtml(context.marker === 'bracket' ? `[${mark}]` : mark);
  const tag = context.marker === 'superscript' ? 'sup' : 'span';
  const markerElement = context.links
    ? `<a data-postkit-part="marker"${attribute('href', `#${ids.note}`)} role="doc-noteref"${attribute(
        'aria-label',
        `Note ${mark}`,
      )}>${text}</a>`
    : `<span data-postkit-part="marker">${text}</span>`;
  return `<${tag} data-postkit-component="Footnote" data-postkit-part="root"${attribute(
    'data-marker',
    context.marker,
  )}${context.links ? attribute('id', ids.reference(occurrence)) : ''}${nodeAnnotations(
    annotated,
    'footnoteReference',
    node,
  )}>${markerElement}</${tag}>`;
}

/**
 * @internal The list of notes, with the Footnotes anatomy. `children`
 * serializes a note's content with the same options as the document.
 */
export function postkitFootnoteListHtml(
  context: PostkitFootnoteRenderContext,
  children: (nodes: readonly PostkitNode[]) => string,
  annotated: boolean,
  placed: PostkitComponentNode | undefined,
): string {
  context.rendered = true;
  const notes = context.resolution.notes.filter((note) => note.definition);
  if (notes.length === 0) return '';
  const ids = postkitFootnoteIds(1, context.scope);
  const listType =
    context.numbering === 'lower-roman'
      ? ' type="i"'
      : context.numbering === 'lower-alpha'
        ? ' type="a"'
        : '';
  const items = notes.map((note) => {
    const definition = note.definition as PostkitFootnoteDefinitionNode;
    const noteIds = postkitFootnoteIds(note.index, context.scope);
    const mark = postkitFootnoteMark(context, note);
    const backlinks = context.backlinks
      ? note.references > 1
        ? ` <span data-postkit-part="backlink">↩ ${Array.from(
            { length: note.references },
            (_, position) =>
              `<a${attribute('href', `#${noteIds.reference(position + 1)}`)} role="doc-backlink"${attribute(
                'aria-label',
                `Back to reference ${mark}${postkitFootnoteBacklinkLabel(position + 1)}`,
              )}>${postkitFootnoteBacklinkLabel(position + 1)}</a>`,
          ).join(' ')}</span>`
        : ` <a data-postkit-part="backlink"${attribute('href', `#${noteIds.reference()}`)} role="doc-backlink"${attribute(
            'aria-label',
            `Back to reference ${mark}`,
          )}>↩</a>`
      : '';
    const content = children(definition.children);
    // The way back sits at the end of the note's last paragraph, as in GFM.
    const withBacklinks =
      backlinks && content.endsWith('</p>')
        ? `${content.slice(0, -4)}${backlinks}</p>`
        : `${content}${backlinks}`;
    // Decimal, roman and alpha read from the list's own numbering; symbols
    // need their mark written out.
    const number =
      context.numbering === 'symbol'
        ? `<span data-postkit-part="number">${escapeHtml(mark)}</span> `
        : '';
    return `<li data-postkit-part="item"${context.links ? attribute('id', noteIds.note) : ''}${nodeAnnotations(
      annotated,
      'footnoteDefinition',
      definition,
    )}>${number}<div data-postkit-part="content"${
      annotated ? ' data-postkit-slot="children"' : ''
    }>${withBacklinks}</div></li>`;
  });
  const title =
    context.title === false
      ? ''
      : `<h2 data-postkit-part="title"${context.links ? attribute('id', ids.title) : ''}>${escapeHtml(
          context.title,
        )}</h2>`;
  const label =
    context.title === false
      ? attribute('aria-label', 'Notes')
      : context.links
        ? attribute('aria-labelledby', ids.title)
        : '';
  const placedAnnotations =
    annotated && placed
      ? ` data-postkit-placed=""${
          placed.props && Object.keys(placed.props).length > 0
            ? attribute('data-postkit-props', JSON.stringify(placed.props))
            : ''
        }`
      : '';
  return `<section data-postkit-component="Footnotes" data-postkit-part="root"${nodeAnnotations(
    annotated,
    'footnotes',
  )}${placedAnnotations}>${title}<hr data-postkit-part="rule"><ol data-postkit-part="list"${listType}${label}>${items.join(
    '',
  )}</ol></section>`;
}
