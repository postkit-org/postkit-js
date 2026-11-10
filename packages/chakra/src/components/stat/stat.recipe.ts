import { defineSlotRecipe } from '@chakra-ui/react';
import { statDefinition } from '@postkit/core/components';

/** The Stat anatomy, from its definition. */
export const postkitStatSlots = statDefinition.slots;
export type PostkitStatSlot = (typeof postkitStatSlots)[number];
export const postkitStatRecipe = defineSlotRecipe({
  className: 'postkit-stat',
  slots: postkitStatSlots,
  base: {
    root: { borderRadius: 'xl', display: 'grid', gap: '1', padding: '4' },
    value: {
      fontFamily: 'heading',
      fontSize: '3xl',
      fontWeight: 'bold',
      letterSpacing: 'tight',
      lineHeight: '1',
    },
    label: { fontWeight: 'semibold' },
    trend: { color: 'colorPalette.fg', fontSize: 'sm', fontWeight: 'semibold' },
    description: { color: 'fg.muted', fontSize: 'sm', marginTop: '1' },
  },
  variants: {
    size: {
      sm: { value: { fontSize: '2xl' } },
      md: {},
      lg: { root: { padding: '5' }, value: { fontSize: '4xl' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
