import { defineSlotRecipe } from '@chakra-ui/react';
import { keyTakeawayDefinition } from '@postkit/core/components';

/** The KeyTakeaway anatomy, from its definition. */
export const postkitKeyTakeawaySlots = keyTakeawayDefinition.slots;
export type PostkitKeyTakeawaySlot = (typeof postkitKeyTakeawaySlots)[number];
export const postkitKeyTakeawayRecipe = defineSlotRecipe({
  className: 'postkit-key-takeaway',
  slots: postkitKeyTakeawaySlots,
  base: {
    root: { borderRadius: 'xl', padding: '5' },
    eyebrow: {
      color: 'colorPalette.fg',
      fontSize: 'xs',
      fontWeight: 'bold',
      letterSpacing: 'wide',
      textTransform: 'uppercase',
    },
    title: { marginTop: '1' },
    body: { color: 'fg.muted', marginTop: '2' },
    list: {
      display: 'grid',
      gap: '2',
      marginBlock: '3 0',
      paddingInlineStart: '5',
    },
    item: { paddingInlineStart: '1' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm', padding: '4' } },
      md: {},
      lg: {
        root: { fontSize: 'lg', padding: '6' },
      },
    },
    variant: {
      outline: {
        root: { borderColor: 'colorPalette.muted', borderWidth: '1px' },
      },
      subtle: {
        root: { background: 'colorPalette.subtle' },
        // `fg.muted` drops below 4.5:1 on the tinted surface.
        body: { color: 'fg' },
      },
      plain: {
        root: {
          borderInlineStartColor: 'colorPalette.solid',
          borderInlineStartWidth: '4px',
          borderRadius: '0',
          paddingInlineEnd: '0',
        },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
