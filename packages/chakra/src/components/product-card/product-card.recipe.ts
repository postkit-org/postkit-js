import { defineSlotRecipe } from '@chakra-ui/react';
import { productCardDefinition } from '@postkit/core/components';

/** The ProductCard anatomy, from its definition. */
export const postkitProductCardSlots = productCardDefinition.slots;
export type PostkitProductCardSlot = (typeof postkitProductCardSlots)[number];
export const postkitProductCardRecipe = defineSlotRecipe({
  className: 'postkit-product-card',
  slots: postkitProductCardSlots,
  base: {
    root: {
      borderRadius: 'xl',
      display: 'grid',
      gridTemplateColumns: { base: '1fr', sm: 'minmax(10rem, 1fr) 2fr' },
      overflow: 'hidden',
    },
    image: {
      aspectRatio: '4 / 3',
      height: '100%',
      objectFit: 'cover',
      width: '100%',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      padding: '5',
    },
    badge: {
      alignSelf: 'flex-start',
      background: 'colorPalette.subtle',
      borderRadius: 'full',
      color: 'colorPalette.fg',
      fontSize: 'xs',
      fontWeight: 'bold',
      paddingBlock: '1',
      paddingInline: '2',
    },
    title: {},
    description: { color: 'fg.muted' },
    rating: { color: 'orange.fg', fontSize: 'sm' },
    footer: {
      alignItems: 'center',
      display: 'flex',
      gap: '3',
      justifyContent: 'space-between',
      marginTop: 'auto',
      paddingTop: '3',
    },
    price: { fontWeight: 'bold' },
    action: {
      background: 'colorPalette.solid',
      borderRadius: 'md',
      color: 'colorPalette.contrast',
      fontWeight: 'semibold',
      paddingBlock: '2',
      paddingInline: '3',
    },
  },
  variants: {
    size: {
      sm: {
        content: { fontSize: 'sm', padding: '4' },
      },
      md: {},
      lg: {
        content: { fontSize: 'lg', padding: '6' },
      },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
