import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Gallery anatomy, from its definition. */
export const postkitGallerySlots = postkitBuiltInSlots.Gallery;

export type PostkitGallerySlot = (typeof postkitGallerySlots)[number];

export const postkitGalleryRecipe = defineSlotRecipe({
  className: 'postkit-gallery',
  slots: postkitGallerySlots,
  base: {
    root: { display: 'grid', gap: '3' },
    header: { display: 'grid', gap: '1' },
    title: {},
    description: { color: 'fg.muted' },
    grid: {
      display: 'grid',
      gap: '3',
      gridTemplateColumns:
        'repeat(var(--postkit-gallery-columns, 2), minmax(0, 1fr))',
    },
    item: { breakInside: 'avoid', margin: '0', minWidth: '0' },
    imageLink: { color: 'inherit', display: 'block' },
    image: {
      borderRadius: 'lg',
      display: 'block',
      height: '100%',
      objectFit: 'cover',
      width: '100%',
    },
    caption: { color: 'fg.muted', fontSize: 'sm', marginTop: '1.5' },
    number: { color: 'fg', fontWeight: 'semibold', marginEnd: '0.5em' },
  },
  variants: {
    size: {
      sm: { grid: { gap: '2' }, caption: { fontSize: 'xs' } },
      md: { grid: { gap: '3' } },
      lg: { grid: { gap: '4' }, caption: { fontSize: 'md' } },
    },
    variant: {
      outline: {
        item: {
          borderColor: 'border',
          borderRadius: 'xl',
          borderWidth: '1px',
          padding: '2',
        },
      },
      subtle: {
        item: { background: 'bg.muted', borderRadius: 'xl', padding: '2' },
      },
      plain: {},
    },
    presentation: {
      grid: {},
      // 2–3 related items side by side; a horizontal snap rail on phones.
      row: {
        grid: {
          gridAutoColumns: { base: '80%', sm: 'minmax(0, 1fr)' },
          gridAutoFlow: 'column',
          gridTemplateColumns: 'none',
          overflowX: { base: 'auto', sm: 'visible' },
          overscrollBehaviorX: 'contain',
          paddingBottom: { base: '1', sm: '0' },
          scrollSnapType: { base: 'x mandatory', sm: 'none' },
          // Focusable so keyboard users can scroll the rail; show where focus is.
          focusVisibleRing: 'outside',
        },
        item: { scrollSnapAlign: 'start' },
      },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle', presentation: 'grid' },
});
