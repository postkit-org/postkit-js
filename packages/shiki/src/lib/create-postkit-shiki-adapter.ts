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

type CodeBlockHighlighter = ReturnType<CodeBlockAdapter['getHighlighter']>;

export type PostkitShikiHighlightOptions = Omit<
  NonNullable<ShikiAdapterOptions<Highlighter>['highlightOptions']>,
  'lang' | 'theme'
>;

export interface CreatePostkitShikiAdapterOptions {
  /**
   * Bundled Shiki grammars to load. Common Postkit content languages are used by default.
   * A code block in any other language renders as plain text instead of failing.
   */
  readonly languages?: readonly BundledLanguage[];
  /** Bundled Shiki themes selected from Chakra's current color scheme. */
  readonly themes?: PostkitShikiThemes;
  /** Additional Shiki options, such as custom transformers, applied during highlighting. */
  readonly highlightOptions?: PostkitShikiHighlightOptions;
}

/** Shiki's built-in plain-text languages, which need no grammar. */
const plainLanguages = new Set(['text', 'plaintext', 'txt', 'plain', 'ansi']);

declare const process: { readonly env: Record<string, string | undefined> };

function isDevelopment(): boolean {
  try {
    return process.env['NODE_ENV'] !== 'production';
  } catch {
    return false;
  }
}

const warned = new Set<string>();

function warnOnce(key: string, message: string, error?: unknown) {
  if (warned.has(key) || !isDevelopment()) return;
  warned.add(key);
  // Development-only guidance; production builds stay silent.
  console.warn(`[@postkit/shiki] ${message}`, ...(error ? [error] : []));
}

/**
 * Wraps Chakra's Shiki highlighter so a block never takes the page down: a language
 * that isn't loaded, or a grammar that fails to tokenize, renders as escaped plain
 * text in the same code block (with a development-only warning) instead of throwing
 * during render.
 */
function withPlainTextFallback(
  highlight: CodeBlockHighlighter,
  highlighter: Pick<Highlighter, 'getLoadedLanguages'>,
): CodeBlockHighlighter {
  let loaded: ReadonlySet<string> | undefined;
  const resolveLanguage = (language: string | undefined): string => {
    if (!language) return 'text';
    loaded ??= new Set(highlighter.getLoadedLanguages());
    if (plainLanguages.has(language) || loaded.has(language)) return language;
    const lower = language.toLowerCase();
    if (plainLanguages.has(lower) || loaded.has(lower)) return lower;
    warnOnce(
      `language:${language}`,
      `No grammar is loaded for "${language}", so its code blocks render as plain text. Add it to createPostkitShikiAdapter({ languages }).`,
    );
    return 'text';
  };

  return (props) => {
    const language = resolveLanguage(props.language);
    try {
      return highlight({ ...props, language });
    } catch (error) {
      warnOnce(
        `error:${language}`,
        `Highlighting "${language}" failed, so the block renders as plain text.`,
        error,
      );
      try {
        return highlight({ ...props, language: 'text' });
      } catch {
        return { code: props.code, highlighted: false };
      }
    }
  };
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

  const adapter = createShikiAdapter<Highlighter>({
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

  return {
    ...adapter,
    getHighlighter(context: Highlighter | null | undefined) {
      const highlight = adapter.getHighlighter(context);
      return context ? withPlainTextFallback(highlight, context) : highlight;
    },
  };
}
