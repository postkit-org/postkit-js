import { defineSlotRecipe, type SlotRecipeConfig } from '@chakra-ui/react';

import { colourTransition } from './interaction';

// The whole tile is one link (`root`); its states are drawn on the preview and the "›".
const enabledRoot = '.site-tile__root:not([aria-disabled=true])';

/**
 * Site Tile (02 §5–6, Interaction states and Components boards).
 *
 * - The preview is `bg.subtle`; hovering the tile turns it `bg.hover` and shows "›"
 *   after the label; pressing darkens it to `bg.pressed`. Nothing scales.
 * - Focus draws the accent ring around the preview (3px offset, as on the board),
 *   not around the whole link.
 * - Sizes follow the Components board: a 168px preview with a 20px radius, 124px / 16px on phones.
 */
export const siteTileRecipe: SlotRecipeConfig = defineSlotRecipe({
  className: 'site-tile',
  slots: ['root', 'preview', 'label', 'chevron', 'description'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      color: 'fg',
      textDecoration: 'none',
      _focusVisible: { outline: 'none' },
    },
    preview: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: { base: '124px', md: '168px' },
      padding: { base: '12px', md: '20px' },
      borderRadius: { base: 'xl', md: '2xl' },
      bg: 'bg.subtle',
      overflow: 'hidden',
      ...colourTransition,
      '@media (hover: hover)': {
        [`${enabledRoot}:is(:hover, [data-hover]):not(:active, [data-active]) &`]:
          { bg: 'bg.hover' },
      },
      [`${enabledRoot}:is(:active, [data-active]) &`]: { bg: 'bg.pressed' },
      '.site-tile__root:is(:focus-visible, [data-focus-visible]) &': {
        outline: '2px solid',
        outlineColor: 'accent',
        outlineOffset: '3px',
      },
    },
    label: {
      marginTop: '14px',
      fontSize: '17px',
      fontWeight: 'medium',
      lineHeight: 1.4,
    },
    chevron: {
      marginInlineStart: '0.25em',
      color: 'fg.quiet',
      fontWeight: 'regular',
      visibility: 'hidden',
      '@media (hover: hover)': {
        [`${enabledRoot}:is(:hover, [data-hover]):not(:active, [data-active]) &`]:
          {
            visibility: 'visible',
          },
      },
      [`${enabledRoot}:is(:active, [data-active]) &`]: {
        visibility: 'visible',
      },
    },
    description: {
      marginTop: '2px',
      color: 'fg.muted',
      fontSize: { base: '14px', md: '15px' },
      lineHeight: 1.45,
      lineClamp: 2,
    },
  },
});
