import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The CodeGroup anatomy, from its definition. */
export const postkitCodeGroupSlots = postkitBuiltInSlots.CodeGroup;
export type PostkitCodeGroupSlot = (typeof postkitCodeGroupSlots)[number];

// Shared by the host-native and standalone recipes, which differ only in subtle.
const codeGroupSizes = {
  sm: { tab: { fontSize: 'xs' } },
  md: {},
  lg: { tab: { fontSize: 'md' } },
};
const codeGroupOutline = {
  root: { borderColor: 'border', borderWidth: '1px' },
};

export const postkitCodeGroupRecipe = defineSlotRecipe({
  className: 'postkit-code-group',
  slots: postkitCodeGroupSlots,
  base: {
    root: { borderRadius: 'xl', overflow: 'hidden' },
    tabs: {
      background: 'bg.muted',
      display: 'flex',
      gap: '1',
      overflowX: 'auto',
      padding: '2',
    },
    tab: {
      borderRadius: 'md',
      color: 'fg.muted',
      cursor: 'pointer',
      fontFamily: 'mono',
      fontSize: 'sm',
      paddingBlock: '1.5',
      paddingInline: '3',
      whiteSpace: 'nowrap',
      _selected: { background: 'bg.emphasized', color: 'fg' },
    },
    panel: { minWidth: '0' },
  },
  variants: {
    size: codeGroupSizes,
    variant: {
      outline: codeGroupOutline,
      subtle: { root: { background: 'bg.subtle' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});

export const postkitStandaloneCodeGroupRecipe = defineSlotRecipe({
  className: 'postkit-code-group',
  slots: postkitCodeGroupSlots,
  base: {
    ...postkitCodeGroupRecipe.base,
    tabs: {
      ...postkitCodeGroupRecipe.base?.tabs,
      background: 'bg.codeMuted',
    },
    tab: {
      ...postkitCodeGroupRecipe.base?.tab,
      color: 'fg.onCodeMuted',
      _selected: {
        background: 'bg.codeSelected',
        color: 'fg.onCodeEmphasized',
      },
    },
  },
  variants: {
    size: codeGroupSizes,
    variant: {
      outline: codeGroupOutline,
      // Subtle is the code surface itself (ink), like CodeBlock's.
      subtle: { root: { background: 'bg.code' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
