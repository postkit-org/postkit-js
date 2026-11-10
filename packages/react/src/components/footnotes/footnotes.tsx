import {
  footnotesDefinition,
  formatPostkitFootnoteNumber,
  postkitFootnoteBacklinkLabel,
  postkitFootnoteIds,
  type PostkitFootnoteBreakpoint,
  type PostkitFootnoteNumberingValue,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { useRef, type ReactNode } from 'react';

import { useFootnotes } from '../../hooks/use-footnotes.js';
import { usePostkitComponentConfig } from '../../lib/config.js';
import {
  postkitView,
  type PostkitPartGetter,
  type PostkitViewProps,
} from '../../lib/view.js';
import {
  postkitFootnoteListNotes,
  postkitFootnotePlacementAttribute,
  resolvePostkitFootnoteSettings,
  type PostkitFootnoteListNote,
  type PostkitFootnoteSettings,
} from '../footnote/footnote-model.js';

export type FootnotesSlot = PostkitSlotOf<typeof footnotesDefinition>;

export type FootnotesProps = Omit<
  PostkitViewProps<typeof footnotesDefinition>,
  'numbering'
> & {
  /** A numbering format, or a function from a note's number to its mark. */
  readonly numbering?: PostkitFootnoteNumberingValue;
  /**
   * Breakpoint minimum widths, in px, for a responsive `placement`. Defaults
   * to Chakra UI's (sm 480, md 768, lg 1024, xl 1280, 2xl 1536).
   */
  readonly breakpoints?: Partial<
    Readonly<Record<PostkitFootnoteBreakpoint, number>>
  >;
};

/** Whether a `title` value shows a heading. */
export function postkitFootnotesTitle(value: unknown): string | undefined {
  if (value === false || value === 'false') return undefined;
  if (typeof value === 'string') return value.trim() ? value : undefined;
  return 'Notes';
}

/** The mark in the list: `1.` for counted numbering, the symbol itself otherwise. */
export function postkitFootnoteListMark(
  index: number,
  numbering: PostkitFootnoteNumberingValue,
): string {
  const mark = formatPostkitFootnoteNumber(index, numbering);
  return numbering === 'symbol' || typeof numbering === 'function'
    ? mark
    : `${mark}.`;
}

/**
 * The way back to a note's references: `↩` for one, `↩ a b` for a shared
 * note. Every renderer emits the same links.
 *
 * @internal
 */
export function renderPostkitFootnoteBacklinks<Part>(
  note: PostkitFootnoteListNote,
  settings: PostkitFootnoteSettings,
  part: (name: 'backlink') => Part,
): ReactNode {
  const ids = postkitFootnoteIds(note.index, settings.scope);
  const mark = formatPostkitFootnoteNumber(note.index, settings.numbering);
  if (note.references <= 1) {
    return (
      <>
        {' '}
        <a
          {...part('backlink')}
          href={`#${ids.reference()}`}
          role="doc-backlink"
          aria-label={`Back to reference ${mark}`}
        >
          ↩
        </a>
      </>
    );
  }
  return (
    <>
      {' '}
      <span {...part('backlink')}>
        <span aria-hidden="true">↩</span>
        {Array.from({ length: note.references }, (_, position) => {
          const label = postkitFootnoteBacklinkLabel(position + 1);
          return (
            <a
              key={label}
              href={`#${ids.reference(position + 1)}`}
              role="doc-backlink"
              aria-label={`Back to reference ${mark}${label}`}
            >
              {label}
            </a>
          );
        })}
      </span>
    </>
  );
}

/**
 * The list of notes (03 §7.1): title, rule, and a numbered list whose notes
 * link back to their references. Its children are the notes, as `Footnote`
 * elements (the Markdown tooling writes them). It runs the footnotes
 * behaviour, which shows the notes beside their references for the `side`,
 * `popover` and `inline` placements; the list stays for print and readers
 * without scripts.
 */
export const Footnotes = postkitView<
  typeof footnotesDefinition,
  FootnotesProps
>(footnotesDefinition, ({ props, part }) => {
  const settings = resolvePostkitFootnoteSettings(
    props,
    usePostkitComponentConfig('Footnotes')?.defaults,
  );
  const notes = postkitFootnoteListNotes(props.children);
  const ref = useRef<HTMLElement>(null);
  useFootnotes(ref, {
    placement: settings.placement,
    sideBreakpoint: settings.sideBreakpoint,
    ...(settings.scope ? { scope: settings.scope } : {}),
    ...(props.breakpoints ? { breakpoints: props.breakpoints } : {}),
    notesKey: notes.map((note) => `${note.index}:${note.references}`).join(),
  });
  if (notes.length === 0) return null;
  const ids = postkitFootnoteIds(1, settings.scope);
  const title = postkitFootnotesTitle(props.title);
  const backlinkPart = part as PostkitPartGetter<'backlink'>;
  return (
    <section
      ref={ref}
      {...part('root')}
      data-marker={settings.marker}
      data-placement={postkitFootnotePlacementAttribute(settings.placement)}
    >
      {title ? (
        <h2 {...part('title')} id={ids.title}>
          {title}
        </h2>
      ) : null}
      <hr {...part('rule')} />
      <ol
        {...part('list')}
        aria-labelledby={title ? ids.title : undefined}
        aria-label={title ? undefined : 'Notes'}
      >
        {notes.map((note) => (
          <li
            {...part('item')}
            key={note.index}
            id={postkitFootnoteIds(note.index, settings.scope).note}
            tabIndex={-1}
            data-footnote-index={note.index}
            data-footnote-references={note.references}
          >
            <span {...part('number')} aria-hidden="true">
              {postkitFootnoteListMark(note.index, settings.numbering)}
            </span>
            <div {...part('content')}>
              {note.content}
              {String(props.backlinks) === 'false'
                ? null
                : renderPostkitFootnoteBacklinks(note, settings, backlinkPart)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
});
