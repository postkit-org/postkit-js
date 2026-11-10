import { defineSlotRecipe } from '@chakra-ui/react';
import { codeBlockDefinition } from '@postkit/core/components';

/**
 * The CodeBlock anatomy, from its definition. `filename`, `actions`,
 * `button`, `scroller` and `lineContent` are compatibility aliases for
 * `title`, `control`, `copyTrigger`, `content` and `codeText`.
 */
export const postkitCodeBlockSlots = codeBlockDefinition.slots;
export type PostkitCodeBlockSlot = (typeof postkitCodeBlockSlots)[number];

// Shared by the host-native and standalone recipes, which differ only in subtle.
const codeBlockSizes = {
  sm: { code: { fontSize: 'xs' } },
  md: { code: { fontSize: 'sm' } },
  lg: { code: { fontSize: 'md' } },
};
const codeBlockOutline = { root: { borderColor: 'border' } };
const codeBlockPlain = { root: { borderRadius: '0', borderWidth: '0' } };

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
    size: codeBlockSizes,
    variant: {
      outline: codeBlockOutline,
      subtle: { root: { background: 'bg.subtle' } },
      plain: codeBlockPlain,
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});

/**
 * The standalone code surfaces (CodeBlock, CodeGroup, Terminal) are a
 * documented exception to following the host's colour mode: they keep their
 * own dark surface in both modes. They express it through the `bg.code*`,
 * `fg.onCode*` and `border.code*` semantic tokens from `postkitDefaultTheme`,
 * whose light and dark values are both dark, so a host can restyle them.
 */
export const postkitStandaloneCodeBlockRecipe = defineSlotRecipe({
  className: 'postkit-code-block',
  slots: postkitCodeBlockSlots,
  base: {
    ...postkitCodeBlockRecipe.base,
    root: {
      ...postkitCodeBlockRecipe.base?.root,
      background: 'bg.code',
      borderRadius: 'xl',
      color: 'fg.onCode',
    },
    header: {
      ...postkitCodeBlockRecipe.base?.header,
      borderBottomColor: 'border.codeDivider',
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
      color: 'fg.onCodeMuted',
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
      color: 'fg.onCodeFaint',
    },
  },
  variants: {
    size: codeBlockSizes,
    variant: {
      outline: codeBlockOutline,
      // Subtle is the code surface itself (ink), not the host's `bg.subtle`:
      // the text here is `fg.onCode`, so a light fill would lose contrast.
      subtle: { root: { background: 'bg.code' } },
      plain: codeBlockPlain,
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
