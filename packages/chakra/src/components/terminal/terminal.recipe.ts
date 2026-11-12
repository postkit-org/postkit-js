import { defineSlotRecipe } from '@chakra-ui/react';
import { postkitBuiltInSlots } from '@postkit/core/components';

/** The Terminal anatomy, from its definition. */
export const postkitTerminalSlots = postkitBuiltInSlots.Terminal;
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
      // Without the preset there's no ink token, so the host-native fallback
      // takes the host's quiet surface instead.
      subtle: { root: { background: 'bg.subtle' } },
      plain: { root: { borderRadius: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});

/**
 * Terminal keeps its own dark surface in both colour modes, like the other
 * standalone code surfaces (see `postkitStandaloneCodeBlockRecipe`).
 */
export const postkitStandaloneTerminalRecipe = defineSlotRecipe({
  className: 'postkit-terminal',
  slots: postkitTerminalSlots,
  base: {
    ...postkitTerminalRecipe.base,
    root: {
      ...postkitTerminalRecipe.base?.root,
      background: 'bg.code',
      color: 'fg.onCode',
    },
    header: {
      ...postkitTerminalRecipe.base?.header,
      background: 'bg.codeMuted',
    },
    dots: {
      ...postkitTerminalRecipe.base?.dots,
      color: 'fg.onCodeSubtle',
    },
    title: {
      ...postkitTerminalRecipe.base?.title,
      color: 'fg.onCodeMuted',
    },
    prompt: {
      ...postkitTerminalRecipe.base?.prompt,
      color: 'fg.onCodeSuccess',
    },
    command: {
      ...postkitTerminalRecipe.base?.command,
      color: 'fg.onCodeEmphasized',
    },
    output: {
      ...postkitTerminalRecipe.base?.output,
      color: 'fg.onCodeMuted',
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
        root: { borderColor: 'border.code', borderWidth: '1px' },
      },
      // Terminal's subtle surface is ink (D12).
      subtle: { root: { background: 'bg.code' } },
      plain: { root: { borderRadius: '0' } },
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
