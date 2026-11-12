import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Carousel anatomy, from its definition. */
export const postkitCarouselSlots = postkitBuiltInSlots.Carousel;

export type PostkitCarouselSlot = (typeof postkitCarouselSlots)[number];

export const postkitCarouselRecipe = defineSlotRecipe({
  className: 'postkit-carousel',
  slots: postkitCarouselSlots,
  base: {
    root: {
      overflow: 'hidden',
    },
    slide: {
      minHeight: '8rem',
    },
    media: {
      display: 'block',
      width: '100%',
      maxHeight: '32rem',
      objectFit: 'cover',
    },
    title: {},
    description: {
      color: 'fg.muted',
    },
    link: {
      display: 'block',
      color: 'inherit',
      textDecoration: 'none',
      _hover: { textDecoration: 'none' },
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    status: {
      color: 'fg.muted',
    },
    emptyState: {
      color: 'fg.muted',
    },
    caption: {
      color: 'fg.muted',
      fontSize: 'sm',
      marginTop: '2',
    },
    number: {
      color: 'fg',
      fontWeight: 'semibold',
      marginEnd: '0.5em',
    },
  },
  variants: {
    size: {
      sm: {
        root: { borderRadius: 'md' },
        content: { padding: '3' },
        description: { fontSize: 'sm', marginTop: '1' },
        controls: { gap: '2', padding: '2' },
        previousTrigger: { fontSize: 'xs' },
        status: { fontSize: 'xs' },
        nextTrigger: { fontSize: 'xs' },
        emptyState: { padding: '3', fontSize: 'sm' },
      },
      md: {
        root: { borderRadius: 'xl' },
        content: { padding: '4' },
        description: { fontSize: 'md', marginTop: '1' },
        controls: { gap: '3', padding: '3' },
        previousTrigger: { fontSize: 'sm' },
        status: { fontSize: 'sm' },
        nextTrigger: { fontSize: 'sm' },
        emptyState: { padding: '4', fontSize: 'md' },
      },
      lg: {
        root: { borderRadius: '2xl' },
        content: { padding: '5' },
        description: { fontSize: 'lg', marginTop: '2' },
        controls: { gap: '4', padding: '4' },
        previousTrigger: { fontSize: 'md' },
        status: { fontSize: 'md' },
        nextTrigger: { fontSize: 'md' },
        emptyState: { padding: '5', fontSize: 'lg' },
      },
    },
    variant: {
      outline: {
        root: { borderWidth: '1px', background: 'bg' },
        controls: { borderTopWidth: '1px' },
      },
      subtle: {
        root: { background: 'bg.muted' },
        controls: { background: 'bg.subtle' },
      },
      plain: {},
    },
    presentation: {
      slides: {},
      // The current item centred, its neighbours at 35%, arrows only.
      peek: {
        root: {
          background: 'transparent',
          borderWidth: '0',
          borderRadius: '0',
        },
        slide: {
          minHeight: '0',
          transition: 'opacity 200ms ease',
          _motionReduce: { transition: 'none' },
          '&[aria-hidden="true"]': { opacity: 0.35 },
        },
        media: {
          aspectRatio: { base: '4 / 3', sm: '16 / 9' },
          borderRadius: 'lg',
          height: 'auto',
          maxHeight: 'none',
        },
        content: { paddingX: '0' },
        controls: {
          alignItems: 'flex-start',
          background: 'transparent',
          borderTopWidth: '0',
          justifyContent: 'flex-end',
          paddingX: '12%',
        },
        caption: { flex: '1', marginTop: '0', minHeight: '2.75rem' },
        previousTrigger: {
          height: '2.75rem',
          minWidth: '2.75rem',
          padding: '0',
        },
        nextTrigger: { height: '2.75rem', minWidth: '2.75rem', padding: '0' },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
    presentation: 'slides',
  },
});
