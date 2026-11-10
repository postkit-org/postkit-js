import { defineSlotRecipe } from '@chakra-ui/react';
import { galleryDefinition } from '@postkit/core/components';

/** The Gallery anatomy, from its definition. */
export const postkitGallerySlots = galleryDefinition.slots;

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
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
