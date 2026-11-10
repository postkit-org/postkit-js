import { defineSlotRecipe } from '@chakra-ui/react';
import { seriesNavigationDefinition } from '@postkit/core/components';

/** The SeriesNavigation anatomy, from its definition. */
export const postkitSeriesNavigationSlots = seriesNavigationDefinition.slots;
export type PostkitSeriesNavigationSlot =
  (typeof postkitSeriesNavigationSlots)[number];
export const postkitSeriesNavigationRecipe = defineSlotRecipe({
  className: 'postkit-series-navigation',
  slots: postkitSeriesNavigationSlots,
  base: {
    root: { borderRadius: 'xl', padding: '4' },
    header: {
      alignItems: 'baseline',
      display: 'flex',
      gap: '3',
      justifyContent: 'space-between',
    },
    title: {},
    position: { color: 'fg.muted', fontSize: 'sm' },
    links: {
      display: 'grid',
      gap: '3',
      gridTemplateColumns: { base: '1fr', sm: '1fr 1fr' },
      marginTop: '4',
    },
    link: {
      borderRadius: 'lg',
      display: 'grid',
      gap: '1',
      padding: '3',
      textDecoration: 'none',
      _hover: { background: 'bg.muted', textDecoration: 'none' },
    },
    direction: {
      color: 'fg.muted',
      fontSize: 'xs',
      textTransform: 'uppercase',
    },
    linkTitle: { color: 'colorPalette.fg' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm', padding: '3' } },
      md: {},
      lg: { root: { fontSize: 'lg', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.subtle' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
