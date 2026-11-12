import { defaultSystem } from '@chakra-ui/react';

import {
  createPostkitShikiAdapter,
  postkitShikiLanguages,
  postkitShikiThemes,
} from './create-postkit-shiki-adapter.js';

describe('createPostkitShikiAdapter', () => {
  it('provides useful Postkit language and color-scheme defaults', () => {
    expect(postkitShikiLanguages).toContain('mdx');
    expect(postkitShikiLanguages).toContain('tsx');
    expect(postkitShikiThemes).toEqual({
      dark: 'github-dark',
      light: 'github-light',
    });
  });

  it('loads Shiki lazily and preserves Chakra line metadata', async () => {
    const adapter = createPostkitShikiAdapter({
      languages: ['typescript'],
    });
    const context = await adapter.loadContext?.();

    try {
      const result = adapter.getHighlighter(context)({
        code: 'const answer = 42;',
        language: 'ts',
        meta: {
          colorScheme: 'light',
          highlightLines: [1],
        },
      });

      expect(result.highlighted).toBe(true);
      expect(result.code).toContain('data-line="1"');
      expect(result.code).toContain('data-highlight');
      expect(result.code).toContain('color:');
    } finally {
      adapter.unloadContext?.(context);
    }
  });

  it('accepts custom bundled themes and Shiki options', async () => {
    const adapter = createPostkitShikiAdapter({
      languages: ['json'],
      themes: {
        dark: 'nord',
        light: 'min-light',
      },
      highlightOptions: {
        tabindex: false,
      },
    });
    const context = await adapter.loadContext?.();

    try {
      const result = adapter.getHighlighter(context)({
        code: '{"ready":true}',
        language: 'json',
        meta: { colorScheme: 'dark' },
      });

      expect(result.highlighted).toBe(true);
      expect(result.code).toContain('data-line="1"');
    } finally {
      adapter.unloadContext?.(context);
    }
  });

  describe('regex engines', () => {
    // One sample per grammar Postkit and its docs site load. The JavaScript
    // engine must tokenize each exactly as Oniguruma (VS Code's engine) does.
    const samples = {
      astro:
        '---\nimport Layout from "../layouts/Layout.astro";\nconst { title } = Astro.props;\n---\n<Layout title={title}>\n  <style>h1 { color: red; }</style>\n  <h1 class:list={["a", { b: true }]}>{title}</h1>\n  <script>console.log(1)</script>\n</Layout>',
      bash: 'npm install @postkit/shiki && echo "$HOME/${PATH}" | grep -E "a|b"\nfor f in *.ts; do echo $f; done',
      css: '.a > b:hover { color: var(--x, #fff); }\n@media (min-width: 40em) { :root { --y: calc(1px + 2rem); } }',
      html: '<!doctype html>\n<html lang="en"><head><style>p{color:red}</style><script>const a = 1 < 2;</script></head>\n<body><p class="x">Hi &amp; bye</p></body></html>',
      json: '{"a": [1, 2.5e3, true, null], "b": {"c": "d\\n"}}',
      markdown:
        '# Heading\n\n- [x] item with `code` and [link](https://x.y)\n\n> quote\n\n```json\n{"a":1}\n```\n\n:::callout{tone="tip"}\nText\n:::',
      mdx: 'import { Callout } from "@postkit/chakra";\n\n# Title\n\n<Callout tone="tip">Hello **world**</Callout>\n\n```ts\nconst a = 1;\n```\n\nexport const meta = { a: 1 };',
      tsx: 'import type { FC } from "react";\nexport const A: FC<{ n?: number }> = ({ n = 1 }) => <div className="x" onClick={() => n satisfies number}>{`t ${n}`}</div>;\nconst re = /a(?<g>b)+/giu;',
      typescript:
        'enum E { A = 1 }\ninterface I<T extends object = {}> { readonly k: keyof T }\nexport async function* f(a: unknown): AsyncGenerator<number> { yield 1 as const; }\nconst x = a?.b ?? c!;',
      yaml: '---\ntitle: "Hello"\ntags: [a, b]\nnested:\n  key: value # comment\n  list:\n    - 1\n    - true\nblock: |\n  text\n',
    } as const;
    const languages = Object.keys(samples) as Array<keyof typeof samples>;

    async function highlightAll(
      engine: 'javascript' | 'oniguruma' | undefined,
    ) {
      // No per-line time limit: under a busy runner Shiki's 500ms default stops tokenizing
      // mid-line, and the engines would differ for reasons that have nothing to do with them.
      const adapter = createPostkitShikiAdapter({
        languages,
        engine,
        highlightOptions: { tokenizeTimeLimit: 0 },
      });
      const context = await adapter.loadContext?.();
      try {
        const highlight = adapter.getHighlighter(context);
        return languages.flatMap((language) =>
          (['light', 'dark'] as const).map(
            (colorScheme) =>
              highlight({
                code: samples[language],
                language,
                meta: { colorScheme },
              }).code,
          ),
        );
      } finally {
        adapter.unloadContext?.(context);
      }
    }

    it('covers the default languages', () => {
      for (const language of postkitShikiLanguages) {
        expect(languages).toContain(language);
      }
    });

    // Compiling ten grammars three times is CPU-bound; leave room for a busy CI runner.
    it(
      'tokenizes every Postkit grammar on the JavaScript engine as Oniguruma does',
      {
        timeout: 30_000,
      },
      async () => {
        const warn = vi.spyOn(console, 'warn');
        try {
          const [javascript, oniguruma, byDefault] = await Promise.all([
            highlightAll('javascript'),
            highlightAll('oniguruma'),
            highlightAll(undefined),
          ]);

          expect(javascript).toEqual(oniguruma);
          expect(byDefault).toEqual(javascript);
          for (const html of javascript) expect(html).toContain('color:');
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      },
    );

    it('skips a language Shiki does not bundle and loads the rest', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      const adapter = createPostkitShikiAdapter({
        languages: ['json', 'not-a-language' as 'json'],
      });
      const context = await adapter.loadContext?.();
      try {
        const result = adapter.getHighlighter(context)({
          code: '{"a":1}',
          language: 'json',
        });
        expect(result.code).toContain('color:');
        expect(String(warn.mock.calls[0]?.[0])).toContain('not-a-language');
      } finally {
        adapter.unloadContext?.(context);
        warn.mockRestore();
      }
    });

    it('rejects a theme Shiki does not bundle', async () => {
      const adapter = createPostkitShikiAdapter({
        themes: { dark: 'not-a-theme' as 'nord', light: 'min-light' },
      });

      await expect(adapter.loadContext?.()).rejects.toThrow('not-a-theme');
    });
  });

  describe('a language that is not loaded', () => {
    async function withAdapter<T>(
      run: (
        highlight: ReturnType<
          ReturnType<typeof createPostkitShikiAdapter>['getHighlighter']
        >,
      ) => T,
      options?: Parameters<typeof createPostkitShikiAdapter>[0],
    ): Promise<T> {
      const adapter = createPostkitShikiAdapter({
        languages: ['typescript'],
        ...options,
      });
      const context = await adapter.loadContext?.();
      try {
        return run(adapter.getHighlighter(context));
      } finally {
        adapter.unloadContext?.(context);
      }
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('falls back to escaped plain text instead of throwing', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      const result = await withAdapter((highlight) =>
        highlight({
          code: '<style>a { color: red; }</style>\n<p>Hi</p>',
          language: 'html',
          meta: { colorScheme: 'dark', highlightLines: [2] },
        }),
      );

      expect(result.highlighted).toBe(true);
      // Escaped, never injected as markup.
      expect(result.code).not.toContain('<style>');
      expect(result.code).not.toContain('<p>');
      expect(result.code).toContain('&#x3C;style>');
      // Still a code block: one span per line, with Chakra's line metadata.
      expect(result.code).toContain('data-line="1"');
      expect(result.code).toMatch(/data-line="2"[^>]*data-highlight/);
      // No token colours: plain text takes the code block's own colour.
      expect(result.code).not.toContain('style=');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('"html"');
    });

    it('warns once per language in development', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      await withAdapter((highlight) => {
        highlight({ code: 'a: 1', language: 'yaml-unloaded' });
        highlight({ code: 'b: 2', language: 'yaml-unloaded' });
      });

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('stays silent in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      try {
        const result = await withAdapter((highlight) =>
          highlight({ code: 'x = 1', language: 'python-in-production' }),
        );
        expect(result.highlighted).toBe(true);
        expect(warn).not.toHaveBeenCalled();
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('treats a missing language as plain text', async () => {
      const result = await withAdapter((highlight) =>
        highlight({ code: 'plain <b>', meta: { colorScheme: 'light' } }),
      );

      expect(result.highlighted).toBe(true);
      expect(result.code).toContain('&#x3C;b>');
    });

    it('matches loaded languages and aliases case-insensitively', async () => {
      const result = await withAdapter((highlight) =>
        highlight({ code: 'const a = 1;', language: 'TS' }),
      );

      expect(result.highlighted).toBe(true);
      expect(result.code).toContain('color:');
    });

    it('falls back to plain text when highlighting throws', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      const result = await withAdapter(
        (highlight) =>
          highlight({ code: 'const a = 1;', language: 'typescript' }),
        {
          highlightOptions: {
            transformers: [
              {
                preprocess(_code, options) {
                  if (options.lang === 'typescript') {
                    throw new Error('grammar failure');
                  }
                },
              },
            ],
          },
        },
      );

      expect(result.highlighted).toBe(true);
      expect(result.code).toContain('data-line="1"');
      expect(result.code).not.toContain('style=');
    });

    it('returns the raw code when even plain text fails', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silenced */
      });
      const result = await withAdapter(
        (highlight) => highlight({ code: '<b>', language: 'typescript' }),
        {
          highlightOptions: {
            transformers: [
              {
                preprocess() {
                  throw new Error('always fails');
                },
              },
            ],
          },
        },
      );

      expect(result).toEqual({ code: '<b>', highlighted: false });
    });
  });

  describe('comment colour on the dark code surface', () => {
    function rgb(hex: string): [number, number, number] {
      const value = hex.replace('#', '');
      return [0, 2, 4].map((index) =>
        Number.parseInt(value.slice(index, index + 2), 16),
      ) as [number, number, number];
    }
    function luminance(color: [number, number, number]): number {
      const [red, green, blue] = color.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }
    function contrast(a: string, b: [number, number, number]): number {
      const [light, dark] = [luminance(rgb(a)), luminance(b)].sort(
        (x, y) => y - x,
      );
      return (light + 0.05) / (dark + 0.05);
    }
    const palette = (name: string) =>
      rgb(String(defaultSystem.tokens.getByName(`colors.${name}`)?.value));

    async function highlight(
      code: string,
      options?: Parameters<typeof createPostkitShikiAdapter>[0],
    ) {
      const adapter = createPostkitShikiAdapter({
        languages: ['typescript'],
        ...options,
      });
      const context = await adapter.loadContext?.();
      try {
        return adapter.getHighlighter(context)({
          code,
          language: 'ts',
          meta: { colorScheme: 'dark' },
        }).code;
      } finally {
        adapter.unloadContext?.(context);
      }
    }

    it('meets 4.5:1 on every Postkit code surface', async () => {
      const html = await highlight('// a comment\nconst answer = 42;');
      const comment = html.match(
        /color:(#[0-9a-f]{6})[^>]*>\/\/ a comment/i,
      )?.[1];

      expect(comment?.toLowerCase()).toBe('#959da5');
      // bg.code and bg.codeMuted in both modes, a host's lighter #1d1d1f code
      // surface, and a highlighted line (whiteAlpha.200 over that surface).
      const highlightedLine = rgb('#1d1d1f').map((channel) =>
        Math.round(channel * 0.92 + 255 * 0.08),
      ) as [number, number, number];
      for (const surface of [
        palette('gray.950'),
        palette('gray.900'),
        rgb('#1d1d1f'),
        highlightedLine,
      ]) {
        expect(contrast(comment ?? '#000000', surface)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    });

    it('leaves the other token colours alone', async () => {
      const html = await highlight('const answer = "42";');

      expect(html.toLowerCase()).toContain('#f97583');
      expect(html.toLowerCase()).toContain('#9ecbff');
    });

    it("lets a host's own replacements win", async () => {
      const html = await highlight('// a comment', {
        highlightOptions: {
          colorReplacements: { 'github-dark': { '#6a737d': '#aabbcc' } },
        },
      });

      expect(html.toLowerCase()).toContain('#aabbcc');
    });
  });
});
