import { defineSlotRecipe } from '@chakra-ui/react';
import { stepsDefinition } from '@postkit/core/components';

/** The Steps anatomy, from its definition. */
export const postkitStepsSlots = stepsDefinition.slots;

export type PostkitStepsSlot = (typeof postkitStepsSlots)[number];

export const postkitStepsRecipe = defineSlotRecipe({
  className: 'postkit-steps',
  slots: postkitStepsSlots,
  base: {
    root: {
      counterReset: 'postkit-step',
      display: 'grid',
      gap: '4',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: {
      alignItems: 'flex-start',
      display: 'grid',
      gap: '3',
      gridTemplateColumns: 'auto 1fr',
      minWidth: '0',
    },
    marker: {
      alignItems: 'center',
      background: 'colorPalette.solid',
      borderRadius: 'full',
      color: 'colorPalette.contrast',
      display: 'inline-flex',
      fontWeight: 'bold',
      height: '7',
      justifyContent: 'center',
      width: '7',
    },
    content: { minWidth: '0', paddingTop: '0.5' },
    title: {},
    description: { color: 'fg.muted', marginTop: '1' },
  },
  variants: {
    size: {
      sm: {
        root: { fontSize: 'sm', gap: '3' },
        marker: { height: '6', width: '6' },
      },
      md: { root: { fontSize: 'md' } },
      lg: {
        root: { fontSize: 'lg', gap: '5' },
        marker: { height: '8', width: '8' },
      },
    },
    variant: {
      outline: {
        marker: {
          background: 'transparent',
          borderColor: 'colorPalette.solid',
          borderWidth: '1px',
          color: 'colorPalette.fg',
        },
      },
      subtle: {
        item: { background: 'bg.muted', borderRadius: 'lg', padding: '3' },
      },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
