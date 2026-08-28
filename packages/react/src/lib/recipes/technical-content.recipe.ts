import { defineSlotRecipe } from '@chakra-ui/react';

export const postkitCodeBlockSlots = [
  'root',
  'header',
  'title',
  // Compatibility alias for title.
  'filename',
  'language',
  'control',
  // Compatibility alias for control.
  'actions',
  'copyTrigger',
  // Compatibility alias for copyTrigger.
  'button',
  'copyIndicator',
  'content',
  // Compatibility alias for content.
  'scroller',
  'code',
  'codeText',
  // Compatibility alias for codeText.
  'lineContent',
  'line',
  'lineNumber',
] as const;
export type PostkitCodeBlockSlot = (typeof postkitCodeBlockSlots)[number];
export const postkitCodeBlockRecipe = defineSlotRecipe({
  className: 'postkit-code-block',
  slots: postkitCodeBlockSlots,
  base: {
    root: {
      background: 'bg',
      color: 'fg',
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      display: 'flex',
    },
    title: { fontFamily: 'mono' },
    filename: {},
    language: {
      color: 'fg.muted',
      fontFamily: 'mono',
      fontSize: 'xs',
      textTransform: 'uppercase',
    },
    control: { alignItems: 'center', display: 'flex' },
    actions: {},
    copyTrigger: {},
    button: {},
    copyIndicator: {
      alignItems: 'center',
      display: 'inline-flex',
      gap: 'inherit',
    },
    content: { maxWidth: '100%' },
    scroller: {},
    code: {
      display: 'block',
      fontFamily: 'mono',
      margin: '0',
    },
    codeText: { display: 'block' },
    lineContent: {},
    line: { minHeight: '1.5em' },
    lineNumber: {
      color: 'fg.muted',
      textAlign: 'end',
      userSelect: 'none',
    },
  },
  variants: {
    size: {
      sm: { code: { fontSize: 'xs' } },
      md: { code: { fontSize: 'sm' } },
      lg: { code: { fontSize: 'md' } },
    },
    variant: {
      outline: { root: { borderColor: 'border' } },
      subtle: { root: { background: 'bg.subtle' } },
      plain: { root: { borderRadius: '0', borderWidth: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitStandaloneCodeBlockRecipe = defineSlotRecipe({
  className: 'postkit-code-block',
  slots: postkitCodeBlockSlots,
  base: {
    ...postkitCodeBlockRecipe.base,
    root: {
      ...postkitCodeBlockRecipe.base?.root,
      background: 'gray.950',
      borderRadius: 'xl',
      color: 'gray.100',
    },
    header: {
      ...postkitCodeBlockRecipe.base?.header,
      borderBottomColor: 'whiteAlpha.300',
      borderBottomWidth: '1px',
      gap: '3',
      paddingBlock: '2',
      paddingInline: '3',
    },
    title: {
      ...postkitCodeBlockRecipe.base?.title,
      fontSize: 'sm',
      fontWeight: 'semibold',
    },
    language: {
      ...postkitCodeBlockRecipe.base?.language,
      color: 'gray.400',
    },
    control: {
      ...postkitCodeBlockRecipe.base?.control,
      gap: '1',
    },
    content: {
      ...postkitCodeBlockRecipe.base?.content,
      overflow: 'auto',
    },
    codeText: {
      ...postkitCodeBlockRecipe.base?.codeText,
      paddingBlock: '3',
      paddingInline: '4',
    },
    lineNumber: {
      ...postkitCodeBlockRecipe.base?.lineNumber,
      color: 'gray.600',
    },
  },
  variants: postkitCodeBlockRecipe.variants,
  defaultVariants: postkitCodeBlockRecipe.defaultVariants,
});

export const postkitCodeGroupSlots = ['root', 'tabs', 'tab', 'panel'] as const;
export type PostkitCodeGroupSlot = (typeof postkitCodeGroupSlots)[number];
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
    size: {
      sm: { tab: { fontSize: 'xs' } },
      md: {},
      lg: { tab: { fontSize: 'md' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { boxShadow: 'sm' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitStandaloneCodeGroupRecipe = defineSlotRecipe({
  className: 'postkit-code-group',
  slots: postkitCodeGroupSlots,
  base: {
    ...postkitCodeGroupRecipe.base,
    tabs: {
      ...postkitCodeGroupRecipe.base?.tabs,
      background: 'gray.900',
    },
    tab: {
      ...postkitCodeGroupRecipe.base?.tab,
      color: 'gray.400',
      _selected: { background: 'whiteAlpha.200', color: 'white' },
    },
  },
  variants: postkitCodeGroupRecipe.variants,
  defaultVariants: postkitCodeGroupRecipe.defaultVariants,
});

export const postkitTerminalSlots = [
  'root',
  'header',
  'dots',
  'title',
  'body',
  'prompt',
  'command',
  'output',
] as const;
export type PostkitTerminalSlot = (typeof postkitTerminalSlots)[number];
export const postkitTerminalRecipe = defineSlotRecipe({
  className: 'postkit-terminal',
  slots: postkitTerminalSlots,
  base: {
    root: {
      background: 'bg',
      borderRadius: 'xl',
      color: 'fg',
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      background: 'bg.muted',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      padding: '2.5',
    },
    dots: { color: 'fg.subtle', letterSpacing: '0.2em' },
    title: { color: 'fg.muted', fontFamily: 'mono', fontSize: 'xs' },
    body: {
      fontFamily: 'mono',
      overflowX: 'auto',
      padding: '4',
      whiteSpace: 'pre-wrap',
    },
    prompt: { color: 'fg.success', marginInlineEnd: '2', userSelect: 'none' },
    command: { color: 'fg' },
    output: { color: 'fg.muted', display: 'block', marginTop: '2' },
  },
  variants: {
    size: {
      sm: { body: { fontSize: 'xs' } },
      md: { body: { fontSize: 'sm' } },
      lg: { body: { fontSize: 'md' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { boxShadow: 'md' } },
      plain: { root: { borderRadius: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitStandaloneTerminalRecipe = defineSlotRecipe({
  className: 'postkit-terminal',
  slots: postkitTerminalSlots,
  base: {
    ...postkitTerminalRecipe.base,
    root: {
      ...postkitTerminalRecipe.base?.root,
      background: 'gray.950',
      color: 'gray.100',
    },
    header: {
      ...postkitTerminalRecipe.base?.header,
      background: 'gray.900',
    },
    dots: {
      ...postkitTerminalRecipe.base?.dots,
      color: 'gray.500',
    },
    title: {
      ...postkitTerminalRecipe.base?.title,
      color: 'gray.400',
    },
    prompt: {
      ...postkitTerminalRecipe.base?.prompt,
      color: 'green.300',
    },
    command: {
      ...postkitTerminalRecipe.base?.command,
      color: 'white',
    },
    output: {
      ...postkitTerminalRecipe.base?.output,
      color: 'gray.400',
    },
  },
  variants: {
    size: {
      sm: { body: { fontSize: 'xs' } },
      md: { body: { fontSize: 'sm' } },
      lg: { body: { fontSize: 'md' } },
    },
    variant: {
      outline: {
        root: { borderColor: 'border.inverted', borderWidth: '1px' },
      },
      subtle: { root: { boxShadow: 'md' } },
      plain: { root: { borderRadius: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitDiffSlots = [
  'root',
  'header',
  'title',
  'code',
  'line',
  'marker',
  'content',
] as const;
export type PostkitDiffSlot = (typeof postkitDiffSlots)[number];
export const postkitDiffRecipe = defineSlotRecipe({
  className: 'postkit-diff',
  slots: postkitDiffSlots,
  base: {
    root: { borderRadius: 'xl', overflow: 'hidden' },
    header: {
      background: 'bg.muted',
      borderBottomColor: 'border',
      borderBottomWidth: '1px',
      paddingBlock: '2',
      paddingInline: '3',
    },
    title: { fontFamily: 'mono', fontSize: 'sm', fontWeight: 'semibold' },
    code: {
      display: 'block',
      fontFamily: 'mono',
      overflowX: 'auto',
      paddingBlock: '3',
    },
    line: {
      display: 'grid',
      gridTemplateColumns: '2rem 1fr',
      minWidth: 'max-content',
      paddingInlineEnd: '4',
    },
    marker: { color: 'fg.muted', textAlign: 'center', userSelect: 'none' },
    content: { whiteSpace: 'pre' },
  },
  variants: {
    size: {
      sm: { code: { fontSize: 'xs' } },
      md: { code: { fontSize: 'sm' } },
      lg: { code: { fontSize: 'md' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.subtle' } },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitFileTreeSlots = [
  'root',
  'title',
  'list',
  'item',
  'icon',
  'path',
  'meta',
] as const;
export type PostkitFileTreeSlot = (typeof postkitFileTreeSlots)[number];
export const postkitFileTreeRecipe = defineSlotRecipe({
  className: 'postkit-file-tree',
  slots: postkitFileTreeSlots,
  base: {
    root: { borderRadius: 'xl', padding: '4' },
    title: { marginBottom: '3' },
    list: {
      display: 'grid',
      fontFamily: 'mono',
      gap: '1',
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
    item: {
      alignItems: 'center',
      display: 'grid',
      gap: '2',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      minWidth: '0',
    },
    icon: { color: 'fg.muted', width: '1.25em' },
    path: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    meta: { color: 'fg.muted', fontSize: 'xs' },
  },
  variants: {
    size: {
      sm: { root: { fontSize: 'xs', padding: '3' } },
      md: { root: { fontSize: 'sm' } },
      lg: { root: { fontSize: 'md', padding: '5' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});

export const postkitFileCardSlots = [
  'root',
  'icon',
  'content',
  'name',
  'description',
  'meta',
  'action',
] as const;
export type PostkitFileCardSlot = (typeof postkitFileCardSlots)[number];
export const postkitFileCardRecipe = defineSlotRecipe({
  className: 'postkit-file-card',
  slots: postkitFileCardSlots,
  base: {
    root: {
      alignItems: 'center',
      borderRadius: 'xl',
      display: 'grid',
      gap: '3',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      padding: '4',
    },
    icon: {
      alignItems: 'center',
      background: 'colorPalette.subtle',
      borderRadius: 'lg',
      color: 'colorPalette.fg',
      display: 'inline-flex',
      fontWeight: 'bold',
      height: '10',
      justifyContent: 'center',
      width: '10',
    },
    content: { minWidth: '0' },
    name: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    description: { color: 'fg.muted', fontSize: 'sm', marginTop: '0.5' },
    meta: { color: 'fg.muted', fontSize: 'xs', marginTop: '1' },
    action: {
      color: 'colorPalette.fg',
      fontWeight: 'semibold',
      whiteSpace: 'nowrap',
    },
  },
  variants: {
    size: {
      sm: { root: { padding: '3' }, icon: { height: '8', width: '8' } },
      md: {},
      lg: { root: { padding: '5' }, icon: { height: '12', width: '12' } },
    },
    variant: {
      outline: { root: { borderColor: 'border', borderWidth: '1px' } },
      subtle: { root: { background: 'bg.muted' } },
      plain: { root: { paddingInline: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'outline' },
});
