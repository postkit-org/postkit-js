import { defineSlotRecipe, type SlotRecipeConfig } from '@chakra-ui/react';

import {
  colourTransition,
  disabled,
  focusRing,
  onHover,
  tapTarget,
} from './interaction';

/**
 * Site SegmentedControl (02 §5): a `bg.subtle` track; the selected segment is `bg.raised`
 * with the `segment` shadow; the others are `fg.muted` until hovered.
 * Registered as `siteSegmentedControl` (Chakra's own is `segmentGroup`).
 *
 * The selected item is marked with `aria-checked="true"` (it's a radio) or `data-state="checked"`.
 */
export const siteSegmentedControlRecipe: SlotRecipeConfig = defineSlotRecipe({
  className: 'site-segmented-control',
  slots: ['root', 'item'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px',
      borderRadius: 'full',
      bg: 'bg.subtle',
    },
    item: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '30px',
      paddingInline: '14px',
      border: 0,
      borderRadius: 'full',
      bg: 'transparent',
      color: 'fg.muted',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: 'regular',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      userSelect: 'none',
      cursor: 'pointer',
      ...colourTransition,
      ...tapTarget(30),
      ...onHover({ color: 'fg' }),
      _focusVisible: focusRing(),
      _checked: {
        bg: 'bg.raised',
        boxShadow: 'segment',
        color: 'fg',
        fontWeight: 'medium',
        cursor: 'default',
      },
      _disabled: disabled(0.4),
    },
  },
  variants: {
    // `icon`: the footer theme switch (SiteHome, SiteColorTokens): 30×24 icon segments on a
    // 2px track, unselected in `fg.quiet`. 24px is one of 02 §6's two allowed touch exceptions.
    size: {
      md: {},
      icon: {
        root: { padding: '2px' },
        item: {
          width: '30px',
          height: '24px',
          paddingInline: 0,
          color: 'fg.quiet',
        },
      },
    },
    fullWidth: {
      true: {
        root: { display: 'flex', width: '100%' },
        item: { flex: '1 0 auto', paddingInline: '8px' },
      },
      false: {},
    },
  },
  defaultVariants: { size: 'md', fullWidth: false },
});
