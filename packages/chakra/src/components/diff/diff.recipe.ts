import { defineSlotRecipe } from '@chakra-ui/react';
import { diffDefinition } from '@postkit/core/components';

/** The Diff anatomy, from its definition. */
export const postkitDiffSlots = diffDefinition.slots;
export type PostkitDiffSlot = (typeof postkitDiffSlots)[number];
export const postkitDiffRecipe = defineSlotRecipe({
  className: 'postkit-diff',
  slots: postkitDiffSlots,
  base: {
    root: { borderRadius: 'xl', overflow: 'hidden' },
    header: {
      background: 'bg.muted',
      borderBottomColor: 'border',
      borderBottomWidth: '1px',
      paddingBlock: '2',
      paddingInline: '3',
    },
    title: { fontFamily: 'mono', fontSize: 'sm', fontWeight: 'semibold' },
    code: {
      display: 'block',
      fontFamily: 'mono',
      // Focusable so keyboard users can scroll it; show where focus is.
      focusVisibleRing: 'inside',
      overflowX: 'auto',
      paddingBlock: '3',
    },
    line: {
      display: 'grid',
      gridTemplateColumns: '2rem 1fr',
      minWidth: 'max-content',
      paddingInlineEnd: '4',
    },
    marker: { color: 'fg.muted', textAlign: 'center', userSelect: 'none' },
    content: { whiteSpace: 'pre' },
  },
  variants: {
    size: {
      sm: { code: { fontSize: 'xs' } },
      md: { code: { fontSize: 'sm' } },
      lg: { code: { fontSize: 'md' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.subtle' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
