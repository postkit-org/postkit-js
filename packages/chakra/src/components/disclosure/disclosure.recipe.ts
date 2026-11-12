import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Disclosure anatomy, from its definition. */
export const postkitDisclosureSlots = postkitBuiltInSlots.Disclosure;

export type PostkitDisclosureSlot = (typeof postkitDisclosureSlots)[number];

export const postkitDisclosureRecipe = defineSlotRecipe({
  className: 'postkit-disclosure',
  slots: postkitDisclosureSlots,
  base: {
    root: { borderRadius: 'lg' },
    summary: {
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      fontWeight: 'semibold',
      gap: '2',
      justifyContent: 'space-between',
      listStyle: 'none',
    },
    indicator: { flex: '0 0 auto' },
    content: { color: 'fg.muted', paddingTop: '3' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm', padding: '3' } },
      md: { root: { fontSize: 'md', padding: '4' } },
      lg: { root: { fontSize: 'lg', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
