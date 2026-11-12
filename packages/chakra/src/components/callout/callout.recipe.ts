import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Callout anatomy, from its definition. Aside shares it. */
export const postkitCalloutSlots = postkitBuiltInSlots.Callout;
export type PostkitCalloutSlot = (typeof postkitCalloutSlots)[number];
export const postkitCalloutRecipe = defineSlotRecipe({
  className: 'postkit-callout',
  slots: postkitCalloutSlots,
  base: {
    root: {
      alignItems: 'flex-start',
      borderRadius: 'xl',
      display: 'flex',
      gap: '3',
      padding: '4',
    },
    icon: {
      alignItems: 'center',
      borderRadius: 'full',
      display: 'inline-flex',
      flex: '0 0 auto',
      fontWeight: 'bold',
      height: '6',
      justifyContent: 'center',
      width: '6',
    },
    content: { minWidth: '0' },
    title: {},
    body: { color: 'fg.muted', marginTop: '1' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'sm', padding: '3' } },
      md: { root: { fontSize: 'md', padding: '4' } },
      lg: { root: { fontSize: 'lg', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      // The fill is the tone's tint (compound variants below). `fg.muted` drops
      // below 4.5:1 on a tint, so the body takes `fg`.
      subtle: { body: { color: 'fg' } },
      plain: {
        root: {
          borderInlineStartColor: 'colorPalette.solid',
          borderInlineStartWidth: '4px',
          borderRadius: '0',
        },
      },
    },
    tone: {
      note: { icon: { background: 'tint.note', color: 'tone.note' } },
      tip: { icon: { background: 'tint.tip', color: 'tone.tip' } },
      important: {
        icon: { background: 'tint.important', color: 'tone.important' },
      },
      warning: { icon: { background: 'tint.warning', color: 'tone.warning' } },
      caution: { icon: { background: 'tint.caution', color: 'tone.caution' } },
    },
  },
  compoundVariants: (
    ['note', 'tip', 'important', 'warning', 'caution'] as const
  ).map((tone) => ({
    variant: 'subtle' as const,
    tone,
    css: { root: { background: `tint.${tone}` } },
  })),
  defaultVariants: { size: 'md', variant: 'subtle', tone: 'note' },
});
