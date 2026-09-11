import { defineSlotRecipe, type SystemStyleObject } from '@chakra-ui/react';

export const postkitProseSlots = [
  'root',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'blockquote',
  'ul',
  'ol',
  'li',
  'hr',
  'pre',
  'code',
  'strong',
  'em',
  'del',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'figure',
  'figcaption',
  'sup',
  'sub',
  'section',
  'dl',
  'dt',
  'dd',
  'kbd',
  'mark',
  'small',
  'details',
  'summary',
  'input',
  'br',
] as const;

export type PostkitProseSlot = (typeof postkitProseSlots)[number];

/**
 * Contextual spacing applied by the Prose wrapper before theme overrides.
 * Consumers can tune the custom properties or replace individual selectors
 * through the prose root recipe or the Prose `css` prop.
 */
export const postkitProseRhythm = {
  '--postkit-prose-flow-space': 'var(--chakra-spacing-4)',
  '--postkit-prose-block-space': 'var(--chakra-spacing-6)',
  '--postkit-prose-section-space': 'var(--chakra-spacing-8)',
  '--postkit-prose-heading-space': 'var(--chakra-spacing-10)',
  '--postkit-prose-title-space': 'var(--chakra-spacing-12)',
  '--postkit-prose-list-indent': 'var(--chakra-spacing-6)',
  '--postkit-prose-list-item-space': 'var(--chakra-spacing-1)',
  '--postkit-prose-list-item-indent': 'var(--chakra-spacing-1)',
  minWidth: '0',
  '& > :where(*)': {
    marginBlockStart: '0',
    marginBlockEnd: '0',
  },
  '& > :where(* + *)': {
    marginBlockStart: 'var(--postkit-prose-flow-space)',
  },
  '& > :where(* + [data-postkit-prose-element="h1"])': {
    marginBlockStart: 'var(--postkit-prose-title-space)',
  },
  '& > :where(* + [data-postkit-prose-element="h2"])': {
    marginBlockStart: 'var(--postkit-prose-heading-space)',
  },
  '& > :where(* + [data-postkit-prose-element="h3"], * + [data-postkit-prose-element="h4"], * + [data-postkit-prose-element="h5"], * + [data-postkit-prose-element="h6"])':
    {
      marginBlockStart: 'var(--postkit-prose-section-space)',
    },
  '& > :where(* + [data-postkit-prose-element="blockquote"], * + [data-postkit-prose-element="pre"], * + [data-postkit-prose-element="table"], * + [data-postkit-prose-element="details"], * + [data-postkit-component])':
    {
      marginBlockStart: 'var(--postkit-prose-block-space)',
    },
  '& > :where(* + [data-postkit-prose-element="figure"], * + [data-postkit-prose-element="section"])':
    {
      marginBlockStart: 'var(--postkit-prose-section-space)',
    },
  '& > :where(* + [data-postkit-prose-element="hr"])': {
    marginBlockStart: 'var(--postkit-prose-heading-space)',
  },
} satisfies SystemStyleObject;

/** List rhythm applied before host and Postkit recipe overrides. */
export const postkitProseListRhythm = {
  ul: {
    paddingInlineStart:
      'var(--postkit-prose-list-indent, var(--chakra-spacing-6))',
  },
  ol: {
    paddingInlineStart:
      'var(--postkit-prose-list-indent, var(--chakra-spacing-6))',
  },
  li: {
    marginBlock:
      'var(--postkit-prose-list-item-space, var(--chakra-spacing-1))',
    paddingInlineStart:
      'var(--postkit-prose-list-item-indent, var(--chakra-spacing-1))',
  },
} satisfies Readonly<Record<'ul' | 'ol' | 'li', SystemStyleObject>>;

export const postkitProseRecipe = defineSlotRecipe({
  className: 'postkit-prose',
  slots: postkitProseSlots,
  base: {
    root: {
      color: 'fg',
      colorPalette: 'blue',
      lineHeight: '1.75',
    },
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    p: {},
    a: {
      color: 'colorPalette.fg',
      fontWeight: 'medium',
      textDecoration: 'underline',
      textDecorationColor: 'colorPalette.muted',
      textUnderlineOffset: '0.2em',
      _hover: {
        textDecorationColor: 'currentColor',
      },
    },
    blockquote: {
      borderInlineStartColor: 'border.emphasized',
      borderInlineStartWidth: '4px',
      color: 'fg.muted',
      fontStyle: 'italic',
      paddingInlineStart: '5',
    },
    ul: {},
    ol: {},
    li: {},
    hr: {
      borderColor: 'border',
    },
    pre: {
      background: 'bg.muted',
      borderRadius: 'lg',
      fontFamily: 'mono',
      fontSize: 'sm',
      lineHeight: '1.7',
      overflowX: 'auto',
      padding: '5',
      whiteSpace: 'pre',
      '& code': {
        background: 'transparent',
        borderRadius: '0',
        color: 'inherit',
        fontSize: 'inherit',
        padding: '0',
      },
    },
    code: {
      background: 'bg.muted',
      borderRadius: 'sm',
      fontFamily: 'mono',
      fontSize: '0.875em',
      paddingInline: '1.5',
      paddingBlock: '0.5',
    },
    strong: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
    del: {
      color: 'fg.muted',
      textDecoration: 'line-through',
    },
    table: {
      borderCollapse: 'collapse',
      display: 'block',
      maxWidth: '100%',
      overflowX: 'auto',
      width: 'max-content',
    },
    thead: {
      borderBlockEndColor: 'border.emphasized',
      borderBlockEndWidth: '2px',
    },
    tbody: {},
    tr: {
      borderBlockEndColor: 'border',
      borderBlockEndWidth: '1px',
    },
    th: {
      fontWeight: 'semibold',
      paddingBlock: '2',
      paddingInline: '3',
      textAlign: 'start',
      verticalAlign: 'bottom',
    },
    td: {
      paddingBlock: '2',
      paddingInline: '3',
      textAlign: 'start',
      verticalAlign: 'top',
    },
    img: {
      borderRadius: 'md',
      display: 'block',
      height: 'auto',
      maxWidth: '100%',
    },
    figure: {},
    figcaption: {
      color: 'fg.muted',
      fontSize: 'sm',
      marginBlockStart: '2',
      textAlign: 'center',
    },
    sup: {
      fontSize: '0.75em',
      lineHeight: '0',
      verticalAlign: 'super',
    },
    sub: {
      fontSize: '0.75em',
      lineHeight: '0',
      verticalAlign: 'sub',
    },
    section: {},
    dl: {},
    dt: {
      fontWeight: 'semibold',
      marginBlockStart: '4',
    },
    dd: {
      color: 'fg.muted',
      marginBlockStart: '1',
      paddingInlineStart: '5',
    },
    kbd: {
      background: 'bg.muted',
      borderColor: 'border.emphasized',
      borderRadius: 'sm',
      borderWidth: '1px',
      boxShadow: '0 1px 0 0 var(--chakra-colors-border-emphasized)',
      fontFamily: 'mono',
      fontSize: '0.8em',
      paddingBlock: '0.5',
      paddingInline: '1.5',
    },
    mark: {
      background: 'yellow.subtle',
      color: 'inherit',
      paddingInline: '0.5',
    },
    small: {
      color: 'fg.muted',
      fontSize: 'sm',
    },
    details: {
      borderColor: 'border',
      borderRadius: 'md',
      borderWidth: '1px',
      padding: '4',
    },
    summary: {
      cursor: 'pointer',
      fontWeight: 'semibold',
    },
    input: {
      accentColor: 'colorPalette.solid',
      marginInlineEnd: '2',
    },
    br: {},
  },
});
