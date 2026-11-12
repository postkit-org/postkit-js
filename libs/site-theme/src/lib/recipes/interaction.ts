// The interaction rules from 02 §6 (the Interaction states board), shared by every site recipe.
import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * Chakra's `_hover` / `_active` skip `:disabled` and `[data-disabled]` but not
 * `aria-disabled`, which is how the site disables controls (they stay focusable).
 */
const enabled = ':not(:disabled, [data-disabled], [aria-disabled=true])';

/** Not while held. */
const notPressed = ':not(:active, [data-active])';

/**
 * Hover: colour only, and only on devices that can hover (touch gets no hover state).
 * It steps aside while the control is held, so the pressed colour wins.
 */
export const onHover = (styles: SystemStyleObject): SystemStyleObject => ({
  '@media (hover: hover)': {
    [`&:is(:hover, [data-hover])${notPressed}${enabled}`]: styles,
  },
});

/** Pressed (held). Buttons also scale; links and tiles only darken. */
export const onPress = (styles: SystemStyleObject): SystemStyleObject => ({
  [`&:is(:active, [data-active])${enabled}`]: styles,
});

/** Buttons scale to 0.98 while held. Never with reduced motion. */
export const pressScale: SystemStyleObject = {
  '@media (prefers-reduced-motion: no-preference)': {
    [`&:is(:active, [data-active])${enabled}`]: { transform: 'scale(0.98)' },
  },
};

/** 120ms ease-out on colour. The global reduced-motion rule makes it instant. */
export const colourTransition: SystemStyleObject = {
  transitionProperty: 'background-color, color, box-shadow, transform',
  transitionDuration: 'hover',
  transitionTimingFunction: 'ease-out',
};

/**
 * The focus ring: 2px `accent`, 2px offset, following the radius, on `:focus-visible` only.
 * `globalCss` already sets it; recipes repeat it so they hold up inside other systems.
 */
export const focusRing = (offset = '2px'): SystemStyleObject => ({
  outline: '2px solid',
  outlineColor: 'accent',
  outlineOffset: offset,
});

/** Disabled stays in place (`aria-disabled`), faded to 0.35–0.45. */
export const disabled = (opacity: number): SystemStyleObject => ({
  opacity,
  cursor: 'not-allowed',
});

/**
 * Grows the hit area to the 44px touch target without changing the drawn size.
 * The element needs `position: relative`.
 */
export const tapTarget = (drawnHeight: number): SystemStyleObject => {
  const overhang = Math.max(0, (44 - drawnHeight) / 2);
  return overhang
    ? {
        _before: {
          content: '""',
          position: 'absolute',
          insetInline: 0,
          insetBlock: `-${overhang}px`,
        },
      }
    : {};
};
