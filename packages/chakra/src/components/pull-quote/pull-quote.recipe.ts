import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The PullQuote anatomy, from its definition. */
export const postkitPullQuoteSlots = postkitBuiltInSlots.PullQuote;
export type PostkitPullQuoteSlot = (typeof postkitPullQuoteSlots)[number];
export const postkitPullQuoteRecipe = defineSlotRecipe({
  className: 'postkit-pull-quote',
  slots: postkitPullQuoteSlots,
  base: {
    root: {
      borderInlineStartColor: 'colorPalette.solid',
      borderInlineStartWidth: '4px',
      margin: '0',
      paddingBlock: '2',
      paddingInline: '5',
    },
    mark: {
      color: 'colorPalette.fg',
      fontFamily: 'heading',
      fontSize: '4xl',
      lineHeight: '0.7',
    },
    quote: {
      fontFamily: 'heading',
      fontSize: '2xl',
      fontWeight: 'medium',
      lineHeight: '1.35',
    },
    attribution: { color: 'fg.muted', fontSize: 'sm', marginTop: '3' },
    cite: { color: 'fg.muted', fontStyle: 'normal' },
  },
  variants: {
    size: {
      sm: { quote: { fontSize: 'lg' } },
      md: {},
      lg: { quote: { fontSize: '3xl' } },
    },
    variant: {
      outline: {
        root: {
          borderBlockColor: 'border',
          borderBlockWidth: '1px',
          paddingBlock: '5',
        },
      },
      subtle: {
        root: { background: 'bg.muted', borderRadius: 'xl', padding: '5' },
      },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
