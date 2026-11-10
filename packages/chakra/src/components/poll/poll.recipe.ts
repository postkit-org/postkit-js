import { defineSlotRecipe } from '@chakra-ui/react';
import { pollDefinition } from '@postkit/core/components';

/** The Poll anatomy, from its definition. */
export const postkitPollSlots = pollDefinition.slots;
export type PostkitPollSlot = (typeof postkitPollSlots)[number];
export const postkitPollRecipe = defineSlotRecipe({
  className: 'postkit-poll',
  slots: postkitPollSlots,
  base: {
    root: { borderRadius: 'xl', padding: '5' },
    question: {},
    description: { color: 'fg.muted', marginTop: '1' },
    options: { display: 'grid', gap: '2', marginTop: '4' },
    option: {
      borderColor: 'border',
      borderRadius: 'lg',
      borderWidth: '1px',
      cursor: 'pointer',
      display: 'grid',
      gap: '1',
      padding: '3',
      textAlign: 'start',
      _hover: { borderColor: 'colorPalette.solid' },
      _selected: {
        background: 'colorPalette.subtle',
        borderColor: 'colorPalette.solid',
      },
    },
    optionLabel: {
      alignItems: 'center',
      display: 'flex',
      fontWeight: 'medium',
      justifyContent: 'space-between',
    },
    result: { color: 'fg.muted', fontSize: 'xs' },
    bar: {
      background: 'colorPalette.solid',
      borderRadius: 'full',
      height: '1',
    },
    status: { color: 'fg.muted', fontSize: 'xs', marginTop: '3' },
  },
  variants: {
    size: {
      sm: {
        root: { fontSize: 'sm', padding: '4' },
      },
      md: {},
      lg: {
        root: { fontSize: 'lg', padding: '6' },
      },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
