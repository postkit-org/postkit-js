import {
  createShikiAdapter,
  type CodeBlockAdapter,
  type ShikiAdapterOptions,
} from '@chakra-ui/react';
import type { BundledLanguage, BundledTheme, Highlighter } from 'shiki';

export const postkitShikiLanguages = [
  'astro',
  'bash',
  'json',
  'markdown',
  'mdx',
  'tsx',
  'typescript',
] as const satisfies readonly BundledLanguage[];

export interface PostkitShikiThemes {
  readonly dark: BundledTheme;
  readonly light: BundledTheme;
}

export const postkitShikiThemes = {
  dark: 'github-dark',
  light: 'github-light',
} as const satisfies PostkitShikiThemes;

/**
 * Colour fixes applied to the curated themes. Postkit's code surface is dark in
 * both colour modes, and GitHub Dark's comment grey (#6a737d) is about 3.6:1
 * on it. #959da5, a lighter grey from the same GitHub palette, is above 4.5:1
 * on every Postkit code surface (`bg.code`, `bg.codeMuted`, highlighted lines).
 * Only the comment colour changes; the other token colours already pass.
 */
const postkitShikiColorReplacements = {
  'github-dark': { '#6a737d': '#959da5' },
} as const satisfies Record<string, Record<string, string>>;

type ColorReplacements = Record<string, string | Record<string, string>>;

function withPostkitColorReplacements(
  options: PostkitShikiHighlightOptions | undefined,
): PostkitShikiHighlightOptions {
  const merged: ColorReplacements = { ...options?.colorReplacements };
  for (const [theme, replacements] of Object.entries(
    postkitShikiColorReplacements,
  )) {
    const own = merged[theme];
    // The host's own replacements for a theme win over Postkit's.
    merged[theme] = {
      ...replacements,
      ...(typeof own === 'object' ? own : {}),
    };
  }
  return { ...options, colorReplacements: merged };
}

export type PostkitShikiHighlightOptions = Omit<
  NonNullable<ShikiAdapterOptions<Highlighter>['highlightOptions']>,
  'lang' | 'theme'
>;

export interface CreatePostkitShikiAdapterOptions {
  /** Bundled Shiki grammars to load. Common Postkit content languages are used by default. */
  readonly languages?: readonly BundledLanguage[];
  /** Bundled Shiki themes selected from Chakra's current color scheme. */
  readonly themes?: PostkitShikiThemes;
  /** Additional Shiki options, such as custom transformers, applied during highlighting. */
  readonly highlightOptions?: PostkitShikiHighlightOptions;
}

/**
 * Creates a lazy Chakra CodeBlock adapter backed by Shiki. Create the adapter
 * once at module scope and pass it to `PostkitProvider.codeBlockAdapter`.
 */
export function createPostkitShikiAdapter(
  options: CreatePostkitShikiAdapterOptions = {},
): CodeBlockAdapter {
  const languages = options.languages ?? postkitShikiLanguages;
  const themes = options.themes ?? postkitShikiThemes;

  return createShikiAdapter<Highlighter>({
    async load() {
      const { createHighlighter } = await import('shiki');

      return createHighlighter({
        langs: [...languages],
        themes: [...new Set([themes.dark, themes.light])],
      });
    },
    highlightOptions: withPostkitColorReplacements(
      options.highlightOptions,
    ) as ShikiAdapterOptions<Highlighter>['highlightOptions'],
    theme: {
      dark: themes.dark,
      light: themes.light,
    },
  });
}
