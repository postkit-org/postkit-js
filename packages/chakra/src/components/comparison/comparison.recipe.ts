import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Comparison anatomy, from its definition. */
export const postkitComparisonSlots = postkitBuiltInSlots.Comparison;
export type PostkitComparisonSlot = (typeof postkitComparisonSlots)[number];
export const postkitComparisonRecipe = defineSlotRecipe({
  className: 'postkit-comparison',
  slots: postkitComparisonSlots,
  base: {
    root: { display: 'grid', gap: '2' },
    title: {},
    description: { color: 'fg.muted' },
    // Focusable so keyboard users can scroll it; show where focus is.
    scroller: { focusVisibleRing: 'inside', marginTop: '2', overflowX: 'auto' },
    table: {
      borderCollapse: 'collapse',
      minWidth: '100%',
      width: 'max-content',
    },
    head: { background: 'bg.muted' },
    header: { fontWeight: 'semibold', padding: '3', textAlign: 'start' },
    row: { borderTopColor: 'border', borderTopWidth: '1px' },
    label: { fontWeight: 'medium', padding: '3', textAlign: 'start' },
    value: { padding: '3' },
  },
  variants: {
    size: {
      sm: {
        table: { fontSize: 'sm' },
        header: { padding: '2' },
        label: { padding: '2' },
        value: { padding: '2' },
      },
      md: {},
      lg: { table: { fontSize: 'lg' } },
    },
    variant: {
      outline: {
        scroller: {
          borderColor: 'border',
          borderRadius: 'xl',
          borderWidth: '1px',
        },
      },
      subtle: { scroller: { background: 'bg.subtle', borderRadius: 'xl' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
