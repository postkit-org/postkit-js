import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

import { postkitFootnoteTokens as tokens } from '../footnote/footnote.recipe.js';

/** The Footnotes anatomy, from its definition. */
export const postkitFootnotesSlots = postkitBuiltInSlots.Footnotes;
export type PostkitFootnotesSlot = (typeof postkitFootnotesSlots)[number];

const backlinkTarget = {
  borderRadius: 'xs',
  color: tokens.accent,
  display: 'inline-block',
  lineHeight: '1',
  marginInlineStart: '0.25em',
  position: 'relative',
  textDecoration: 'none',
  _after: {
    content: '""',
    height: '24px',
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
  },
  _focusVisible: {
    outlineColor: 'fg',
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
} as const;

/**
 * The list of notes (03 §7.1). Subtle fills a quiet surface, outline draws
 * an edge, plain keeps a short rule above the list. A note jumped to stays
 * tinted until the reader returns with ↩.
 */
export const postkitFootnotesRecipe = defineSlotRecipe({
  className: 'postkit-footnotes',
  slots: postkitFootnotesSlots,
  base: {
    root: {
      clear: 'both',
      color: tokens.textColor,
      fontSize: tokens.textSize,
      lineHeight: '1.6',
    },
    title: {
      color: 'fg.muted',
      fontSize: 'sm',
      fontWeight: 'semibold',
      lineHeight: '1.3',
      marginBlock: '0',
      marginBlockEnd: '2',
    },
    rule: { border: '0', display: 'none', margin: '0' },
    list: {
      display: 'grid',
      gap: '1',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: {
      borderRadius: 'md',
      columnGap: '1',
      display: 'grid',
      gridTemplateColumns: '1.75em minmax(0, 1fr)',
      marginInline: '-2',
      paddingBlock: '1',
      paddingInline: '2',
      scrollMarginBlock: '8',
      transitionDuration: '1.5s',
      transitionProperty: 'background-color',
      transitionTimingFunction: 'ease-out',
      '&:target, &[data-targeted]': {
        background: tokens.targetBg,
        transitionDuration: '0s',
      },
      _focus: { outline: 'none' },
      _focusVisible: {
        outlineColor: 'fg',
        outlineOffset: '2px',
        outlineStyle: 'solid',
        outlineWidth: '2px',
      },
      _motionReduce: { transition: 'none' },
    },
    number: {
      color: tokens.numberColor,
      fontSize: tokens.numberSize,
      fontVariantNumeric: 'tabular-nums',
    },
    content: {
      minWidth: '0',
      '& > *': { marginBlock: '0' },
      '& > * + *': { marginBlockStart: '2' },
      // ↩ follows the note's last line.
      '& > p:last-of-type': { display: 'inline' },
    },
    backlink: {
      color: tokens.accent,
      whiteSpace: 'nowrap',
      '&:is(a)': backlinkTarget,
      '& a': backlinkTarget,
    },
  },
  variants: {
    size: {
      sm: {
        root: { fontSize: 'var(--postkit-footnote-text-size, {fontSizes.xs})' },
      },
      md: {},
      lg: {
        root: { fontSize: 'var(--postkit-footnote-text-size, {fontSizes.md})' },
      },
    },
    variant: {
      outline: {
        root: {
          borderColor: 'border',
          borderRadius: 'lg',
          borderWidth: '1px',
          paddingBlock: '4',
          paddingInline: '5',
        },
      },
      subtle: {
        root: {
          background: 'bg.muted',
          borderRadius: 'lg',
          paddingBlock: '4',
          paddingInline: '5',
        },
      },
      plain: {
        rule: {
          borderBlockStartColor: tokens.ruleColor,
          borderBlockStartStyle: 'solid',
          borderBlockStartWidth: '1px',
          display: 'block',
          marginBlockEnd: '3',
          width: tokens.ruleWidth,
        },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
