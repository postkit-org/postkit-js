import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The AudienceBoundary anatomy, from its definition. */
export const postkitAudienceBoundarySlots =
  postkitBuiltInSlots.AudienceBoundary;
export type PostkitAudienceBoundarySlot =
  (typeof postkitAudienceBoundarySlots)[number];
export const postkitAudienceBoundaryRecipe = defineSlotRecipe({
  className: 'postkit-audience-boundary',
  slots: postkitAudienceBoundarySlots,
  base: {
    root: { position: 'relative' },
    label: { color: 'fg.muted', fontSize: 'xs', marginBottom: '2' },
    content: { minWidth: '0' },
    fallback: {
      background: 'bg.muted',
      borderRadius: 'xl',
      color: 'fg.muted',
      padding: '5',
      textAlign: 'center',
    },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: {},
      lg: { root: { fontSize: 'lg' } },
    },
    variant: {
      outline: {
        root: {
          borderColor: 'border',
          borderRadius: 'xl',
          borderWidth: '1px',
          padding: '4',
        },
      },
      subtle: {
        root: { background: 'bg.subtle', borderRadius: 'xl', padding: '4' },
        label: {
          background: 'bg.muted',
          borderRadius: 'full',
          display: 'inline-flex',
          paddingBlock: '1',
          paddingInline: '2',
        },
      },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
