import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The FileTree anatomy, from its definition. */
export const postkitFileTreeSlots = postkitBuiltInSlots.FileTree;
export type PostkitFileTreeSlot = (typeof postkitFileTreeSlots)[number];
export const postkitFileTreeRecipe = defineSlotRecipe({
  className: 'postkit-file-tree',
  slots: postkitFileTreeSlots,
  base: {
    root: { borderRadius: 'xl', padding: '4' },
    title: { marginBottom: '3' },
    list: {
      display: 'grid',
      fontFamily: 'mono',
      gap: '1',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: {
      alignItems: 'center',
      display: 'grid',
      gap: '2',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      minWidth: '0',
    },
    icon: { color: 'fg.muted', width: '1.25em' },
    path: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    meta: { color: 'fg.muted', fontSize: 'xs' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'xs', padding: '3' } },
      md: { root: { fontSize: 'sm' } },
      lg: { root: { fontSize: 'md', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
