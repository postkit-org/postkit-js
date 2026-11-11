'use client';

import { chakra, type BoxProps, type UnstyledProp } from '@chakra-ui/react';
import {
  footnoteDefinition,
  formatPostkitFootnoteNumber,
  postkitFootnoteIds,
  type PostkitFootnoteMarker,
  type PostkitFootnoteNumbering,
  type PostkitFootnoteNumberingValue,
  type PostkitFootnotePlacementValue,
} from '@postkit/core/components';
import {
  postkitFootnoteNumber,
  postkitFootnotePlacementAttribute,
  postkitFootnoteUsesSidenotes,
  resolvePostkitFootnoteSettings,
  usePostkitComponentConfig,
} from '@postkit/react';
import type { ReactNode } from 'react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { Sidenote } from '../sidenote/sidenote.js';
import {
  postkitFootnoteRecipe,
  type PostkitFootnoteSlot,
} from './footnote.recipe.js';

export type FootnoteProps = {
  readonly identifier?: string;
  readonly index?: number | string;
  readonly occurrence?: number | string;
  readonly references?: number | string;
  readonly marker?: PostkitFootnoteMarker;
  /** A numbering format, or a function from the note's number to its mark. */
  readonly numbering?: PostkitFootnoteNumbering | PostkitFootnoteNumberingValue;
  readonly placement?: PostkitFootnotePlacementValue;
  readonly sideBreakpoint?: number | string;
  readonly scope?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'outline' | 'subtle' | 'plain';
  /** The note, copied beside the reference for side, popover and inline. */
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitFootnoteSlot>;
  readonly classNames?: Partial<Readonly<Record<PostkitFootnoteSlot, string>>>;
} & UnstyledProp;

/**
 * A footnote reference (03 §7.1), styled by the `postkitFootnote` recipe:
 * the same anatomy and links as `@postkit/react`'s, with the note copied
 * beside the first reference for the placements that show it in place.
 */
export const Footnote = postkitChakraView<
  typeof footnoteDefinition,
  FootnoteProps
>(
  footnoteDefinition,
  postkitFootnoteRecipe,
  ({ props, part }) => {
    const settings = resolvePostkitFootnoteSettings(
      props,
      usePostkitComponentConfig('Footnotes')?.defaults,
    );
    const index = postkitFootnoteNumber(props.index, 1);
    const occurrence = postkitFootnoteNumber(props.occurrence, 1);
    const ids = postkitFootnoteIds(index, settings.scope);
    const mark = formatPostkitFootnoteNumber(index, settings.numbering);
    const hasNote =
      props.children !== undefined &&
      props.children !== null &&
      props.children !== false;
    return (
      <chakra.span
        {...part('root')}
        id={ids.reference(occurrence)}
        data-marker={settings.marker}
        data-placement={postkitFootnotePlacementAttribute(settings.placement)}
      >
        <chakra.a
          {...part('marker')}
          href={`#${ids.note}`}
          role="doc-noteref"
          aria-label={`Note ${mark}`}
        >
          {settings.marker === 'superscript' ? (
            <sup>{mark}</sup>
          ) : settings.marker === 'bracket' ? (
            `[${mark}]`
          ) : (
            mark
          )}
        </chakra.a>
        {hasNote &&
        occurrence === 1 &&
        postkitFootnoteUsesSidenotes(settings.placement) ? (
          <Sidenote
            id={ids.sidenote}
            index={index}
            mark={mark}
            placement={settings.placement}
            size={props.size}
            variant={props.variant}
          >
            {props.children}
          </Sidenote>
        ) : null}
      </chakra.span>
    );
  },
  { fallback: 'recipe' },
);
