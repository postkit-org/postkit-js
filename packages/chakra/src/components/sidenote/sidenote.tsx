'use client';

import { chakra, type SystemStyleObject } from '@chakra-ui/react';
import {
  postkitFootnotePlacementSteps,
  sidenoteDefinition,
  type PostkitFootnotePlacement,
  type PostkitFootnotePlacementValue,
} from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitChakraView } from '../../lib/view.js';
import { postkitFootnoteTokens as tokens } from '../footnote/footnote.recipe.js';
import { postkitSidenoteRecipe } from './sidenote.recipe.js';

export type SidenoteProps = {
  readonly index?: number;
  /** The note's mark, in the list's numbering. */
  readonly mark?: string;
  /** The placement, so the first paint matches the host's breakpoints. */
  readonly placement?: PostkitFootnotePlacementValue;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'outline' | 'subtle' | 'plain';
  readonly id?: string;
  readonly children?: ReactNode;
};

/**
 * Styles per placement, keyed by the host's breakpoint conditions, so
 * server-rendered markup is already right at every width: Chakra resolves
 * `md`, `xl`, … from the host's system.
 *
 * @internal
 */
export function postkitResponsivePlacementCss(
  value: PostkitFootnotePlacementValue | undefined,
  styles: (placement: PostkitFootnotePlacement) => SystemStyleObject,
): SystemStyleObject {
  const css: Record<string, SystemStyleObject> = {};
  for (const [breakpoint, placement] of postkitFootnotePlacementSteps(value)) {
    if (breakpoint === 'base') Object.assign(css, styles(placement));
    else css[breakpoint] = { ...css[breakpoint], ...styles(placement) };
  }
  return css as SystemStyleObject;
}

/**
 * In the margin beside the text (03 §7.1): each note floats to its line and
 * a later one clears the one before, so it pushes down. Aside shares the
 * column (D14).
 */
export const postkitSidenoteMarginCss: SystemStyleObject = {
  clear: 'inline-end',
  display: 'block',
  float: 'inline-end',
  marginBlockEnd: '4',
  marginBlockStart: '0.2em',
  marginInlineEnd: `calc(-1 * (${tokens.sidenoteWidth} + ${tokens.sidenoteGap}))`,
  position: 'relative',
  width: tokens.sidenoteWidth,
};

/**
 * Where the note shows, by placement; the recipe draws it. Before the
 * footnotes behaviour runs, the responsive value decides (side notes show at
 * their breakpoints); once it runs, `data-active-placement` decides, with
 * its fallbacks.
 */
function placementCss(
  placement: PostkitFootnotePlacementValue | undefined,
): SystemStyleObject {
  return {
    display: 'none',
    ...postkitResponsivePlacementCss(placement, (step) =>
      step === 'side' ? postkitSidenoteMarginCss : { display: 'none' },
    ),
    '&[data-active-placement=end]': { display: 'none' },
    '&[data-active-placement=side]': postkitSidenoteMarginCss,
    '&[data-active-placement=inline]:not([data-open])': { display: 'none' },
    '&[data-active-placement=inline][data-open]': {
      display: 'block',
      float: 'none',
      marginBlock: '2',
      marginInlineEnd: '0',
      position: 'relative',
      width: 'auto',
    },
    '&[popover]': {
      float: 'none',
      margin: '0',
      maxWidth: 'calc(100vw - 16px)',
      width: tokens.sidenoteWidth,
    },
    '&[popover]:not(:popover-open)': { display: 'none' },
    '&[popover]:popover-open': { display: 'block' },
    '@media print': { display: 'none !important' },
  };
}

/**
 * @internal The note beside its reference, as `Footnote` renders it for the
 * `side`, `popover` and `inline` placements. It starts hidden (or in the
 * margin, at a `side` breakpoint); the footnotes behaviour takes over.
 */
export const Sidenote = postkitChakraView<
  typeof sidenoteDefinition,
  SidenoteProps
>(
  sidenoteDefinition,
  postkitSidenoteRecipe,
  ({ props, part }) => {
    const mark = props.mark ?? String(props.index ?? '');
    return (
      <chakra.span
        {...part('root', { css: placementCss(props.placement) })}
        id={props.id}
        hidden
        role="note"
        aria-label={`Note ${mark}`}
      >
        <chakra.span {...part('number')} aria-hidden="true">
          {mark}
        </chakra.span>
        <chakra.span {...part('content')}>{props.children}</chakra.span>
        <button
          type="button"
          data-postkit-sidenote-close=""
          aria-label={`Close note ${mark}`}
          hidden
        >
          ×
        </button>
      </chakra.span>
    );
  },
  { fallback: 'recipe' },
);
