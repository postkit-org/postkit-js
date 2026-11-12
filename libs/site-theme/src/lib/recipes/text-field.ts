import { defineSlotRecipe, type SlotRecipeConfig } from '@chakra-ui/react';

import { colourTransition, disabled } from './interaction';

const ring = (width: number, color: string) =>
  `inset 0 0 0 ${width}px {colors.${color}}`;

/**
 * Site TextField (02 §5–6, Interaction states and Signup states boards).
 *
 * - The field is `bg.subtle`; on a grey surface (`surface: 'subtle'`) it turns `bg.raised` (white).
 * - Hover draws a 1px `border.hover` hairline; focus is a 2px inset `accent` ring.
 * - `aria-invalid="true"` draws a 2px inset `tone.caution` ring; the `error` slot sits below
 *   with a "!" badge. While invalid and focused, the caution ring stays and the accent
 *   focus outline is added outside it.
 * - `shape`: `rounded` (14px, 02 §4 "inputs: 12–14") or `pill` (`full`, as every board draws it).
 *
 * Registered as `siteTextField` so Chakra's `input` and `field` recipes stay untouched.
 */
export const siteTextFieldRecipe: SlotRecipeConfig = defineSlotRecipe({
  className: 'site-text-field',
  slots: ['root', 'label', 'input', 'error', 'errorBadge'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: 'fg.muted',
      fontSize: '13px',
      lineHeight: 1.4,
    },
    input: {
      width: '100%',
      minWidth: 0,
      border: 0,
      bg: 'bg.subtle',
      color: 'fg',
      fontFamily: 'inherit',
      appearance: 'none',
      ...colourTransition,
      _placeholder: { color: 'fg.quiet', opacity: 1 },
      '@media (hover: hover)': {
        '&:is(:hover, [data-hover]):not(:focus-visible, [data-focus-visible], :disabled, [aria-disabled=true], [aria-invalid=true])':
          { boxShadow: ring(1, 'border.hover') },
      },
      _focusVisible: {
        outline: 'none',
        boxShadow: ring(2, 'accent'),
      },
      _invalid: {
        boxShadow: ring(2, 'tone.caution'),
        _focusVisible: {
          boxShadow: ring(2, 'tone.caution'),
          outline: '2px solid',
          outlineColor: 'accent',
          outlineOffset: '2px',
        },
      },
      _disabled: disabled(0.45),
    },
    error: {
      display: 'flex',
      // The badge sits on the first line when a long message wraps.
      alignItems: 'flex-start',
      gap: '8px',
      marginTop: '10px',
      color: 'tone.caution',
      fontSize: '14px',
      lineHeight: 1.45,
    },
    errorBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 16px',
      height: '16px',
      marginTop: '2px',
      borderRadius: 'full',
      bg: 'tone.caution',
      color: 'fg.inverted',
      fontSize: '8px',
      fontWeight: 'semibold',
      lineHeight: 1,
    },
  },
  variants: {
    size: {
      md: {
        input: { height: '44px', paddingInline: '16px', fontSize: '14px' },
        error: { paddingInlineStart: '16px' },
      },
      lg: {
        input: { height: '48px', paddingInline: '18px', fontSize: '15px' },
        error: { paddingInlineStart: '18px' },
      },
    },
    shape: {
      rounded: { input: { borderRadius: 'lg' } },
      pill: { input: { borderRadius: 'full' } },
    },
    surface: {
      page: {},
      subtle: { input: { bg: 'bg.raised' } },
    },
  },
  defaultVariants: { size: 'md', shape: 'rounded', surface: 'page' },
});
