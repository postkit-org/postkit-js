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
    highlightOptions:
      options.highlightOptions as ShikiAdapterOptions<Highlighter>['highlightOptions'],
    theme: {
      dark: themes.dark,
      light: themes.light,
    },
  });
}
