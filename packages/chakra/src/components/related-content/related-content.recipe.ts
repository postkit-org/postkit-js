import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The RelatedContent anatomy, from its definition. */
export const postkitRelatedContentSlots = postkitBuiltInSlots.RelatedContent;
export type PostkitRelatedContentSlot =
  (typeof postkitRelatedContentSlots)[number];
export const postkitRelatedContentRecipe = defineSlotRecipe({
  className: 'postkit-related-content',
  slots: postkitRelatedContentSlots,
  base: {
    root: { display: 'grid', gap: '3' },
    title: {},
    list: {
      display: 'grid',
      gap: '3',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: { minWidth: '0' },
    link: {
      borderRadius: 'lg',
      color: 'inherit',
      display: 'grid',
      gap: '1',
      padding: '3',
      textDecoration: 'none',
      _hover: { background: 'bg.muted', textDecoration: 'none' },
    },
    itemTitle: { color: 'colorPalette.fg' },
    description: { color: 'fg.muted', fontSize: 'sm' },
    meta: { color: 'fg.muted', fontSize: 'xs' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: {},
      lg: { root: { fontSize: 'lg' } },
    },
    variant: {
      outline: {
        item: { borderColor: 'border', borderRadius: 'lg', borderWidth: '1px' },
      },
      subtle: { item: { background: 'bg.subtle', borderRadius: 'lg' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
