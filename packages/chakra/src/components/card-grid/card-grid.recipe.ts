import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The CardGrid anatomy, from its definition. */
export const postkitCardGridSlots = postkitBuiltInSlots.CardGrid;

export type PostkitCardGridSlot = (typeof postkitCardGridSlots)[number];

export const postkitCardGridRecipe = defineSlotRecipe({
  className: 'postkit-card-grid',
  slots: postkitCardGridSlots,
  base: {
    root: { display: 'grid', gap: '4' },
    header: { display: 'grid', gap: '1' },
    title: {},
    description: { color: 'fg.muted' },
    grid: {
      display: 'grid',
      gap: '4',
      gridTemplateColumns:
        'repeat(var(--postkit-card-columns, 2), minmax(0, 1fr))',
    },
    card: {
      borderRadius: 'xl',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '0',
      overflow: 'hidden',
    },
    image: { aspectRatio: '16 / 9', objectFit: 'cover', width: '100%' },
    cardBody: { display: 'grid', flex: '1', gap: '2', padding: '4' },
    cardTitle: {},
    cardDescription: { color: 'fg.muted' },
    meta: { color: 'fg.muted', fontSize: 'sm' },
    link: {
      color: 'colorPalette.fg',
      fontWeight: 'semibold',
      marginTop: 'auto',
    },
  },
  variants: {
    size: {
      sm: { grid: { gap: '3' }, cardBody: { fontSize: 'sm', padding: '3' } },
      md: {},
      lg: { grid: { gap: '5' }, cardBody: { fontSize: 'lg', padding: '5' } },
    },
    variant: {
      outline: { card: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { card: { background: 'bg.muted' } },
      plain: { cardBody: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
