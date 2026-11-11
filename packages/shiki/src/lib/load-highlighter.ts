import type {
  BundledLanguage,
  BundledTheme,
  HighlighterCore,
  RegexEngine,
} from 'shiki';

import type { PostkitShikiEngine } from './create-postkit-shiki-adapter.js';
import { plainLanguages, warnOnce } from './warn.js';

/*
 * Loaded on demand by `createPostkitShikiAdapter`'s `load()`, so none of this, nor the
 * loaders for Shiki's own chunks, is in the page's first-load JavaScript.
 */

async function loadEngine(engine: PostkitShikiEngine): Promise<RegexEngine> {
  if (engine === 'oniguruma') {
    const { createOnigurumaEngine } = await import('shiki/engine/oniguruma');
    return createOnigurumaEngine(import('shiki/wasm'));
  }
  const { createJavaScriptRegexEngine } =
    await import('shiki/engine/javascript');
  return createJavaScriptRegexEngine();
}

export async function loadHighlighter(
  languages: readonly string[],
  themes: readonly string[],
  engine: PostkitShikiEngine,
): Promise<HighlighterCore> {
  // Fine-grained imports: Shiki's core, one regex engine, and only the configured
  // grammars and themes. Each grammar and theme is its own lazily loaded chunk.
  const [
    { createHighlighterCore },
    regexEngine,
    { bundledLanguages },
    { bundledThemes },
  ] = await Promise.all([
    import('shiki/core'),
    loadEngine(engine),
    import('shiki/langs'),
    import('shiki/themes'),
  ]);
  const languageLoaders = languages.flatMap((language) => {
    if (plainLanguages.has(language)) return [];
    const loader = bundledLanguages[language as BundledLanguage];
    if (!loader) {
      warnOnce(
        `grammar:${language}`,
        `"${language}" is not a bundled Shiki language, so it was not loaded.`,
      );
      return [];
    }
    return [loader];
  });
  const themeLoaders = themes.map((theme) => {
    const loader = bundledThemes[theme as BundledTheme];
    if (!loader) {
      throw new Error(
        `[@postkit/shiki] "${theme}" is not a bundled Shiki theme.`,
      );
    }
    return loader;
  });

  return createHighlighterCore({
    engine: regexEngine,
    langs: languageLoaders,
    themes: themeLoaders,
  });
}
