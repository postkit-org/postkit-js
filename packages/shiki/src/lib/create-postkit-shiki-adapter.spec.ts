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
});
