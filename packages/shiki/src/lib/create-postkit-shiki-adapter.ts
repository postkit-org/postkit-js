import {
  createShikiAdapter,
  type CodeBlockAdapter,
  type ShikiAdapterOptions,
} from '@chakra-ui/react';
import type {
  BundledLanguage,
  BundledTheme,
  Highlighter,
  HighlighterCore,
} from 'shiki';

import { plainLanguages, warnOnce } from './warn.js';

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
 * The regular-expression engine Shiki tokenizes with.
 *
 * - `javascript` (the default) runs the grammars on the browser's own `RegExp`
 *   through `@shikijs/engine-javascript`: about 20 KB gzipped and no WASM.
 * - `oniguruma` loads the Oniguruma WASM build (about 225 KB gzipped), the
 *   engine VS Code uses. Choose it for a grammar the JavaScript engine can't run.
 */
export type PostkitShikiEngine = 'javascript' | 'oniguruma';

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
   * Only these grammars (and the ones they embed) are downloaded. A code block in any
   * other language renders as plain text instead of failing.
   */
  readonly languages?: readonly BundledLanguage[];
  /** Bundled Shiki themes selected from Chakra's current color scheme. */
  readonly themes?: PostkitShikiThemes;
  /** Additional Shiki options, such as custom transformers, applied during highlighting. */
  readonly highlightOptions?: PostkitShikiHighlightOptions;
  /**
   * The regular-expression engine: `javascript` (the default, no WASM) or `oniguruma`.
   * Every grammar in `postkitShikiLanguages`, plus `css`, `html` and `yaml`, highlights
   * the same on both.
   */
  readonly engine?: PostkitShikiEngine;
}

/**
 * Wraps Chakra's Shiki highlighter so a block never takes the page down: a language
 * that isn't loaded, or a grammar the engine can't run, renders as escaped plain
 * text in the same code block (with a development-only warning) instead of throwing
 * during render.
 */
function withPlainTextFallback(
  highlight: CodeBlockHighlighter,
  highlighter: HighlighterCore,
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
        `Highlighting "${language}" failed, so the block renders as plain text. If the JavaScript regex engine can't run this grammar, pass engine: 'oniguruma'.`,
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
 *
 * Nothing is downloaded until the first code block mounts. Then Shiki's core, the
 * JavaScript regex engine (or Oniguruma, with `engine: 'oniguruma'`), the configured
 * grammars and the two themes load once, and every block below the provider reuses them.
 */
export function createPostkitShikiAdapter(
  options: CreatePostkitShikiAdapterOptions = {},
): CodeBlockAdapter {
  const languages = options.languages ?? postkitShikiLanguages;
  const themes = options.themes ?? postkitShikiThemes;
  const engine = options.engine ?? 'javascript';

  const adapter = createShikiAdapter<HighlighterCore>({
    load: async () => {
      const { loadHighlighter } = await import('./load-highlighter.js');
      return loadHighlighter(
        [...new Set(languages)],
        [...new Set([themes.dark, themes.light])],
        engine,
      );
    },
    highlightOptions: withPostkitColorReplacements(
      options.highlightOptions,
    ) as ShikiAdapterOptions<HighlighterCore>['highlightOptions'],
    theme: {
      dark: themes.dark,
      light: themes.light,
    },
  });

  return {
    ...adapter,
    getHighlighter(context: HighlighterCore | null | undefined) {
      const highlight = adapter.getHighlighter(context);
      return context ? withPlainTextFallback(highlight, context) : highlight;
    },
  };
}
