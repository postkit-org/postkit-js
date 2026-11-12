import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The SponsorBlock anatomy, from its definition. */
export const postkitSponsorBlockSlots = postkitBuiltInSlots.SponsorBlock;
export type PostkitSponsorBlockSlot = (typeof postkitSponsorBlockSlots)[number];
export const postkitSponsorBlockRecipe = defineSlotRecipe({
  className: 'postkit-sponsor-block',
  slots: postkitSponsorBlockSlots,
  base: {
    root: { borderRadius: 'xl', display: 'grid', gap: '3', padding: '4' },
    disclosure: {
      color: 'fg.muted',
      fontSize: 'xs',
      fontWeight: 'semibold',
      letterSpacing: 'wide',
      textTransform: 'uppercase',
    },
    logo: {
      maxHeight: '2.5rem',
      maxWidth: '10rem',
      objectFit: 'contain',
      objectPosition: 'left center',
    },
    content: { display: 'grid', gap: '1' },
    name: {},
    message: { color: 'fg.muted' },
    action: {
      color: 'colorPalette.fg',
      fontWeight: 'semibold',
      justifySelf: 'start',
      marginTop: '1',
    },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm', padding: '3' } },
      md: {},
      lg: { root: { fontSize: 'lg', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: {
        root: {
          borderBlockColor: 'border',
          borderBlockWidth: '1px',
          borderRadius: '0',
          paddingInline: '0',
        },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
