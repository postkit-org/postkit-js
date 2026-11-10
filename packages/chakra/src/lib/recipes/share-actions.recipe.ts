import { defineSlotRecipe } from '@chakra-ui/react';

export const postkitShareActionsSlots = [
  'root',
  'label',
  'actions',
  'action',
  'icon',
  'status',
] as const;

export type PostkitShareActionsSlot = (typeof postkitShareActionsSlots)[number];

export const postkitShareActionsRecipe = defineSlotRecipe({
  className: 'postkit-share-actions',
  slots: postkitShareActionsSlots,
  base: {
    root: { display: 'grid' },
    label: { fontWeight: 'semibold' },
    actions: { display: 'flex', flexWrap: 'wrap' },
    // The actions are Chakra Buttons, whose solid variant sets white text. Every
    // Postkit variant replaces the fill, so the text and hover fill follow it.
    action: { color: 'fg', cursor: 'pointer' },
    icon: {
      alignItems: 'center',
      display: 'inline-flex',
      justifyContent: 'center',
    },
    status: { color: 'fg.muted' },
  },
  variants: {
    size: {
      sm: {
        root: { gap: '2' },
        label: { fontSize: 'sm' },
        actions: { gap: '1.5' },
        action: { fontSize: 'xs', minHeight: '8', paddingInline: '2.5' },
        status: { fontSize: 'xs' },
      },
      md: {
        root: { gap: '3' },
        label: { fontSize: 'md' },
        actions: { gap: '2' },
        action: { fontSize: 'sm', minHeight: '9', paddingInline: '3' },
        status: { fontSize: 'sm' },
      },
      lg: {
        root: { gap: '4' },
        label: { fontSize: 'lg' },
        actions: { gap: '2.5' },
        action: { fontSize: 'md', minHeight: '10', paddingInline: '4' },
        status: { fontSize: 'md' },
      },
    },
    variant: {
      outline: {
        action: {
          background: 'bg',
          borderColor: 'border',
          borderWidth: '1px',
          _hover: { background: 'bg.muted' },
        },
      },
      subtle: {
        action: {
          background: 'bg.muted',
          _hover: { background: 'bg.emphasized' },
        },
      },
      plain: {
        action: {
          background: 'transparent',
          paddingInline: '1',
          _hover: { background: 'bg.muted' },
        },
      },
    },
    layout: {
      inline: {
        root: { alignItems: 'center', display: 'flex', flexWrap: 'wrap' },
      },
      buttons: {},
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
    layout: 'buttons',
  },
});
