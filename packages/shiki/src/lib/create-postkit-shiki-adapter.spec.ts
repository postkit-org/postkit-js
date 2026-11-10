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
