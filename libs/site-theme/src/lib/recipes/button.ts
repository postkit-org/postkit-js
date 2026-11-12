import { defineRecipe, type RecipeDefinition } from '@chakra-ui/react';

import {
  colourTransition,
  disabled,
  focusRing,
  onHover,
  onPress,
  pressScale,
  tapTarget,
} from './interaction';

/**
 * Site Button (02 §5, Interaction states board): a `full` pill, 40px (`md`) or 48px (`lg`).
 * Registered as `siteButton`, not `button`: Postkit's own components (the carousel) use
 * Chakra's Button, and restyling that recipe would change them inside the site too.
 */
export const siteButtonRecipe: RecipeDefinition = defineRecipe({
  className: 'site-button',
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: 'tap',
    border: 0,
    borderRadius: 'full',
    fontFamily: 'inherit',
    fontWeight: 'regular',
    lineHeight: 1.2,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    cursor: 'pointer',
    ...colourTransition,
    ...pressScale,
    _focusVisible: focusRing(),
  },
  variants: {
    variant: {
      primary: {
        bg: 'bg.inverted',
        color: 'fg.inverted',
        ...onHover({ bg: 'bg.invertedHover' }),
        ...onPress({ bg: 'bg.invertedPressed' }),
        _disabled: disabled(0.35),
      },
      secondary: {
        bg: 'bg.subtle',
        color: 'fg',
        ...onHover({ bg: 'bg.hover' }),
        ...onPress({ bg: 'bg.pressed' }),
        _disabled: disabled(0.45),
      },
    },
    size: {
      md: {
        minHeight: '40px',
        paddingInline: '18px',
        fontSize: '14px',
        ...tapTarget(40),
      },
      lg: { minHeight: '48px', paddingInline: '22px', fontSize: '15px' },
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
