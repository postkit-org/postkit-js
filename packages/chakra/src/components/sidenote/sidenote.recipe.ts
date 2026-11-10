import { defineSlotRecipe } from '@chakra-ui/react';
import { sidenoteDefinition } from '@postkit/core/components';

import { postkitFootnoteTokens as tokens } from '../footnote/footnote.recipe.js';

/** The Sidenote anatomy, from its (internal) definition. */
export const postkitSidenoteSlots = sidenoteDefinition.slots;
export type PostkitSidenoteSlot = (typeof postkitSidenoteSlots)[number];

/**
 * The note beside its reference: how it looks in each placement. Where and
 * whether it shows is the view's (the placement is responsive); a host
 * restyles the look here, or from `Footnote`'s root
 * (`& [data-postkit-component=Sidenote]`).
 */
export const postkitSidenoteRecipe = defineSlotRecipe({
  className: 'postkit-sidenote',
  slots: postkitSidenoteSlots,
  base: {
    root: {
      boxSizing: 'border-box',
      color: tokens.textColor,
      fontSize: tokens.textSize,
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: '1.55',
      textAlign: 'start',
      textIndent: '0',
      // In the margin: a quiet edge that the linked mark lights up.
      '&[data-active-placement=side]': {
        borderInlineStartColor: 'transparent',
        borderInlineStartStyle: 'solid',
        borderInlineStartWidth: '2px',
        paddingInlineStart: '3',
        transitionDuration: 'fast',
        transitionProperty: 'border-color',
        _motionReduce: { transition: 'none' },
      },
      '&[data-active-placement=side][data-highlighted]': {
        borderInlineStartColor: tokens.accent,
      },
      // Opened in place, under the line.
      '&[data-active-placement=inline]': {
        background: 'bg.muted',
        borderRadius: 'lg',
        paddingBlock: '2.5',
        paddingInlineEnd: '10',
        paddingInlineStart: '3',
      },
      '&[popover]': {
        background: 'bg',
        borderColor: 'border',
        borderRadius: 'lg',
        borderStyle: 'solid',
        borderWidth: '1px',
        boxShadow: 'md',
        color: 'fg',
        padding: '3',
      },
      '& [data-postkit-sidenote-close]': {
        alignItems: 'center',
        background: 'transparent',
        border: '0',
        borderRadius: 'xs',
        color: 'fg.muted',
        cursor: 'pointer',
        display: 'inline-flex',
        font: 'inherit',
        height: '24px',
        insetBlockStart: '2',
        insetInlineEnd: '2',
        justifyContent: 'center',
        padding: '0',
        position: 'absolute',
        width: '24px',
        _focusVisible: {
          outlineColor: 'fg',
          outlineOffset: '2px',
          outlineStyle: 'solid',
          outlineWidth: '2px',
        },
      },
      '& [data-postkit-sidenote-close][hidden]': { display: 'none' },
    },
    number: {
      color: tokens.numberColor,
      fontVariantNumeric: 'tabular-nums',
      marginInlineEnd: '2',
    },
    content: {},
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'xs' } },
      md: {},
      lg: { root: { fontSize: 'md' } },
    },
    variant: {
      outline: {},
      subtle: {},
      plain: {
        root: {
          '&[data-active-placement=inline]': { background: 'transparent' },
        },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
