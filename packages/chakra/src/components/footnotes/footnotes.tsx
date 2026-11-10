'use client';

import {
  chakra,
  useChakraContext,
  type BoxProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import {
  footnotesDefinition,
  formatPostkitFootnoteNumber,
  postkitFootnoteBacklinkLabel,
  postkitFootnoteIds,
  type PostkitFootnoteBreakpoint,
  type PostkitFootnoteMarker,
  type PostkitFootnoteNumbering,
  type PostkitFootnoteNumberingValue,
  type PostkitFootnotePlacementValue,
} from '@postkit/core/components';
import {
  postkitFootnoteListMark,
  postkitFootnoteListNotes,
  postkitFootnotePlacementAttribute,
  postkitFootnotesTitle,
  resolvePostkitFootnoteSettings,
  useFootnotes,
  usePostkitComponentConfig,
} from '@postkit/react';
import { useMemo, useRef, type ReactNode } from 'react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitResponsivePlacementCss } from '../sidenote/sidenote.js';
import {
  postkitFootnotesRecipe,
  type PostkitFootnotesSlot,
} from './footnotes.recipe.js';

export type FootnotesProps = {
  readonly title?: string | false;
  readonly backlinks?: boolean | 'true' | 'false';
  readonly marker?: PostkitFootnoteMarker;
  /** A numbering format, or a function from a note's number to its mark. */
  readonly numbering?: PostkitFootnoteNumbering | PostkitFootnoteNumberingValue;
  readonly placement?: PostkitFootnotePlacementValue;
  readonly sideBreakpoint?: number | string;
  readonly scope?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'outline' | 'subtle' | 'plain';
  /** The notes, as `Footnote` elements (the Markdown tooling writes them). */
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitFootnotesSlot>;
  readonly classNames?: Partial<Readonly<Record<PostkitFootnotesSlot, string>>>;
} & UnstyledProp;

/** `48rem`, `768px` or `30em` → px. */
function px(value: string | null | undefined): number | undefined {
  if (!value) return 0;
  const match = /^(-?\d*\.?\d+)(px|rem|em)?$/.exec(value.trim());
  if (!match) return undefined;
  const amount = Number(match[1]);
  return match[2] === 'rem' || match[2] === 'em' ? amount * 16 : amount;
}

/**
 * The list of notes (03 §7.1), styled by the `postkitFootnotes` recipe. It
 * runs the shared footnotes behaviour with the host's Chakra breakpoints, so
 * a responsive `placement` switches where the theme's `md`, `xl`, … do.
 */
export const Footnotes = postkitChakraView<
  typeof footnotesDefinition,
  FootnotesProps
>(
  footnotesDefinition,
  postkitFootnotesRecipe,
  ({ props, part }) => {
    const settings = resolvePostkitFootnoteSettings(
      props,
      usePostkitComponentConfig('Footnotes')?.defaults,
    );
    const system = useChakraContext();
    const values = system.breakpoints.values;
    const breakpoints = useMemo(() => {
      const entries: Partial<Record<PostkitFootnoteBreakpoint, number>> = {};
      for (const entry of values) {
        const min = px(entry.min);
        if (min !== undefined) {
          entries[entry.name as PostkitFootnoteBreakpoint] = min;
        }
      }
      return entries;
    }, [values]);
    const notes = postkitFootnoteListNotes(props.children);
    const ref = useRef<HTMLElement>(null);
    useFootnotes(ref, {
      placement: settings.placement,
      sideBreakpoint: settings.sideBreakpoint,
      breakpoints,
      ...(settings.scope ? { scope: settings.scope } : {}),
      notesKey: notes.map((note) => `${note.index}:${note.references}`).join(),
    });
    if (notes.length === 0) return null;
    const ids = postkitFootnoteIds(1, settings.scope);
    const title = postkitFootnotesTitle(props.title);
    return (
      <chakra.section
        ref={ref}
        {...part('root', {
          css: {
            // Sidenotes replace the list on screen; print keeps it.
            ...postkitResponsivePlacementCss(settings.placement, (step) => ({
              display: step === 'side' ? 'none' : 'block',
            })),
            '&[data-active-placement]:not([data-active-placement=side])': {
              display: 'block',
            },
            '&[data-active-placement=side]': { display: 'none' },
            '@media print': { display: 'block !important' },
          },
        })}
        data-marker={settings.marker}
        data-placement={postkitFootnotePlacementAttribute(settings.placement)}
      >
        {title ? (
          <chakra.h2 {...part('title')} id={ids.title}>
            {title}
          </chakra.h2>
        ) : null}
        <chakra.hr {...part('rule')} />
        <chakra.ol
          {...part('list')}
          aria-labelledby={title ? ids.title : undefined}
          aria-label={title ? undefined : 'Notes'}
        >
          {notes.map((note) => {
            const noteIds = postkitFootnoteIds(note.index, settings.scope);
            const mark = formatPostkitFootnoteNumber(
              note.index,
              settings.numbering,
            );
            return (
              <chakra.li
                {...part('item')}
                key={note.index}
                id={noteIds.note}
                tabIndex={-1}
                data-footnote-index={note.index}
                data-footnote-references={note.references}
              >
                <chakra.span {...part('number')} aria-hidden="true">
                  {postkitFootnoteListMark(note.index, settings.numbering)}
                </chakra.span>
                <chakra.div {...part('content')}>
                  {note.content}
                  {String(props.backlinks) ===
                  'false' ? null : note.references <= 1 ? (
                    <>
                      {' '}
                      <chakra.a
                        {...part('backlink')}
                        href={`#${noteIds.reference()}`}
                        role="doc-backlink"
                        aria-label={`Back to reference ${mark}`}
                      >
                        ↩
                      </chakra.a>
                    </>
                  ) : (
                    <>
                      {' '}
                      <chakra.span {...part('backlink')}>
                        <span aria-hidden="true">↩</span>
                        {Array.from(
                          { length: note.references },
                          (_, position) => {
                            const label = postkitFootnoteBacklinkLabel(
                              position + 1,
                            );
                            return (
                              <a
                                key={label}
                                href={`#${noteIds.reference(position + 1)}`}
                                role="doc-backlink"
                                aria-label={`Back to reference ${mark}${label}`}
                              >
                                {label}
                              </a>
                            );
                          },
                        )}
                      </chakra.span>
                    </>
                  )}
                </chakra.div>
              </chakra.li>
            );
          })}
        </chakra.ol>
      </chakra.section>
    );
  },
  { fallback: 'recipe' },
);
