import {
  createPostkitTheme,
  type PostkitThemeOverrides,
  type PostkitThemeSlotMap,
} from '@postkit/react/theme';

const baseTheme = createPostkitTheme({
  typography: {
    body: 'Inter, sans-serif',
    heading: 'Newsreader, serif',
    mono: 'JetBrains Mono, monospace',
  },
  callout: {
    base: {
      root: { borderColor: 'border.subtle', borderRadius: 'xl' },
      title: { color: 'fg', fontWeight: 'normal' },
    },
    variants: {
      tone: {
        warning: { root: { colorPalette: 'orange' } },
      },
    },
  },
  codeBlock: {
    base: {
      root: { background: 'bg.subtle' },
      control: { gap: '2' },
    },
    variants: {
      variant: {
        outline: { root: { borderColor: 'whiteAlpha.200' } },
      },
    },
  },
  linkPreview: {
    base: {
      root: { borderColor: 'border', borderRadius: 'lg' },
      title: { color: 'fg' },
    },
    variants: {
      compact: {
        true: { content: { padding: '3' } },
      },
      presentation: {
        card: { root: { background: 'bg.panel' } },
      },
    },
  },
  prose: {
    base: {
      root: { '--postkit-prose-flow-space': 'var(--chakra-spacing-5)' },
      h1: { fontSize: { base: '4xl', md: '6xl' } },
      p: { color: 'fg.muted' },
    },
  },
  socialPost: {
    variants: {
      branding: {
        native: { serviceBadge: { color: 'colorPalette.fg' } },
      },
    },
  },
});

export function createConsumerTheme(overrides: PostkitThemeOverrides = {}) {
  return [baseTheme, createPostkitTheme(overrides)];
}

export type AllPostkitThemeSlots = {
  readonly [Name in keyof PostkitThemeSlotMap]: PostkitThemeSlotMap[Name];
};
