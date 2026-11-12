import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Footnote anatomy, from its definition. */
export const postkitFootnoteSlots = postkitBuiltInSlots.Footnote;
export type PostkitFootnoteSlot = (typeof postkitFootnoteSlots)[number];

/**
 * The footnote knobs (03 §7.1). Colours are Chakra semantic tokens, so they
 * follow the host's colour mode and theme (restyle them with
 * `createPostkitTheme({ footnote, footnotes })`); sizes read the same
 * `--postkit-footnote-*` and `--postkit-sidenote-*` properties as
 * `@postkit/react/styles.css`, with the spec's defaults.
 *
 * @internal
 */
export const postkitFootnoteTokens = Object.freeze({
  accent: 'fg',
  markerColor: 'fg.muted',
  markerSize: 'var(--postkit-footnote-marker-size, 0.7em)',
  numberColor: 'fg.muted',
  numberSize: 'var(--postkit-footnote-number-size, 1em)',
  textColor: 'fg.muted',
  textSize: 'var(--postkit-footnote-text-size, {fontSizes.sm})',
  ruleColor: 'border',
  ruleWidth: 'var(--postkit-footnote-rule-width, 64px)',
  targetBg: 'bg.emphasized',
  sidenoteWidth: 'var(--postkit-sidenote-width, 232px)',
  sidenoteGap: 'var(--postkit-sidenote-gap, 48px)',
});

const tokens = postkitFootnoteTokens;

/** A 24×24 hit area around a small mark (WCAG 2.5.8). */
export const postkitFootnoteTapTarget = {
  content: '""',
  height: 'max(100%, 24px)',
  left: '50%',
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'max(100%, 24px)',
} as const;

export const postkitFootnoteRecipe = defineSlotRecipe({
  className: 'postkit-footnote',
  slots: postkitFootnoteSlots,
  base: {
    root: { fontStyle: 'normal' },
    marker: {
      borderRadius: 'xs',
      color: tokens.markerColor,
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 'medium',
      paddingInline: '0.12em',
      position: 'relative',
      scrollMarginBlock: '8',
      textDecoration: 'none',
      transitionDuration: 'fast',
      transitionProperty: 'background-color',
      transitionTimingFunction: 'ease-out',
      '& sup': {
        fontSize: tokens.markerSize,
        lineHeight: '0',
        verticalAlign: 'super',
      },
      _after: postkitFootnoteTapTarget,
      '&[aria-expanded=true], [data-highlighted] > &': {
        background: tokens.targetBg,
      },
      _focusVisible: {
        outlineColor: 'fg',
        outlineOffset: '2px',
        outlineStyle: 'solid',
        outlineWidth: '2px',
      },
      '[data-marker=bracket] > &': { fontSize: '0.85em' },
      '[data-marker=pill] > &': {
        background: tokens.accent,
        borderRadius: 'full',
        color: 'bg',
        display: 'inline-block',
        fontSize: tokens.markerSize,
        lineHeight: '1.5',
        minWidth: '1.5em',
        paddingInline: '0.4em',
        textAlign: 'center',
        verticalAlign: '0.2em',
        _hover: { background: tokens.accent },
      },
      _motionReduce: { transition: 'none' },
    },
  },
  variants: {
    size: {
      sm: { root: { '--postkit-footnote-marker-size': '0.65em' } },
      md: {},
      lg: { root: { '--postkit-footnote-marker-size': '0.8em' } },
    },
    // Subtle tints the mark on hover, outline rings it, plain underlines it.
    variant: {
      outline: {
        marker: {
          _hover: {
            outlineColor: 'border',
            outlineStyle: 'solid',
            outlineWidth: '1px',
          },
        },
      },
      subtle: { marker: { _hover: { background: tokens.targetBg } } },
      plain: { marker: { _hover: { textDecoration: 'underline' } } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
