import { defineSlotRecipe } from '@chakra-ui/react';
import { tabsDefinition } from '@postkit/core/components';

/** The Tabs anatomy, from its definition. */
export const postkitTabsSlots = tabsDefinition.slots;

export type PostkitTabsSlot = (typeof postkitTabsSlots)[number];

export const postkitTabsRecipe = defineSlotRecipe({
  className: 'postkit-tabs',
  slots: postkitTabsSlots,
  base: {
    root: { display: 'grid', gap: '3' },
    list: { display: 'flex', gap: '1', overflowX: 'auto' },
    tab: {
      borderRadius: 'md',
      color: 'fg.muted',
      cursor: 'pointer',
      fontWeight: 'medium',
      paddingBlock: '2',
      paddingInline: '3',
      whiteSpace: 'nowrap',
      _selected: {
        background: 'colorPalette.subtle',
        color: 'colorPalette.fg',
      },
    },
    panels: { minWidth: '0' },
    panel: { color: 'fg', minWidth: '0' },
  },
  variants: {
    size: {
      sm: {
        root: { fontSize: 'sm' },
        tab: { paddingBlock: '1.5', paddingInline: '2' },
      },
      md: { root: { fontSize: 'md' } },
      lg: {
        root: { fontSize: 'lg' },
        tab: { paddingBlock: '2.5', paddingInline: '4' },
      },
    },
    variant: {
      outline: {
        panels: {
          borderColor: 'border',
          borderRadius: 'lg',
          borderWidth: '1px',
          padding: '4',
        },
      },
      subtle: {
        panels: { background: 'bg.muted', borderRadius: 'lg', padding: '4' },
      },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
