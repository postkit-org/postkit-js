import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The FileCard anatomy, from its definition. */
export const postkitFileCardSlots = postkitBuiltInSlots.FileCard;
export type PostkitFileCardSlot = (typeof postkitFileCardSlots)[number];
export const postkitFileCardRecipe = defineSlotRecipe({
  className: 'postkit-file-card',
  slots: postkitFileCardSlots,
  base: {
    root: {
      alignItems: 'center',
      borderRadius: 'xl',
      display: 'grid',
      gap: '3',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      padding: '4',
    },
    icon: {
      alignItems: 'center',
      background: 'colorPalette.subtle',
      borderRadius: 'lg',
      color: 'colorPalette.fg',
      display: 'inline-flex',
      fontWeight: 'bold',
      height: '10',
      justifyContent: 'center',
      width: '10',
    },
    content: { minWidth: '0' },
    name: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    description: { color: 'fg.muted', fontSize: 'sm', marginTop: '0.5' },
    meta: { color: 'fg.muted', fontSize: 'xs', marginTop: '1' },
    action: {
      color: 'colorPalette.fg',
      fontWeight: 'semibold',
      whiteSpace: 'nowrap',
    },
  },
  variants: {
    size: {
      sm: { root: { padding: '3' }, icon: { height: '8', width: '8' } },
      md: {},
      lg: { root: { padding: '5' }, icon: { height: '12', width: '12' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
