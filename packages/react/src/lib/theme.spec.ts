import { createSystem, defaultConfig, defaultSystem } from '@chakra-ui/react';

import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
  postkitRecipeKeys,
} from './theme.js';

describe('Postkit theme', () => {
  it('leaves Postkit presentation recipes opt-in', () => {
    const system = createPostkitSystem();

    for (const key of Object.values(postkitRecipeKeys)) {
      expect(system.isSlotRecipe(key)).toBe(false);
    }
  });

  it('registers every component under a stable Chakra slot-recipe key', () => {
    const system = createPostkitSystem({ preset: postkitDefaultTheme });

    expect(Object.values(postkitRecipeKeys)).toHaveLength(35);
    for (const key of Object.values(postkitRecipeKeys)) {
      expect(system.isSlotRecipe(key)).toBe(true);
    }
  });

  it('merges component-specific overrides after Postkit defaults', () => {
    const system = createPostkitSystem({
      system: defaultSystem,
      preset: postkitDefaultTheme,
      theme: createPostkitTheme({
        audio: {
          base: {
            root: { boxShadow: 'md' },
          },
        },
      }),
    });
    const recipe = system.getSlotRecipe(postkitRecipeKeys.audio) as {
      readonly base?: {
        readonly root?: {
          readonly borderRadius?: string;
          readonly boxShadow?: string;
        };
      };
    };

    expect(recipe.base?.root).toMatchObject({
      borderRadius: 'xl',
      boxShadow: 'md',
    });
  });

  it('exposes typed prose slots for Markdown typography', () => {
    const system = createPostkitSystem({
      system: defaultSystem,
      theme: createPostkitTheme({
        prose: {
          base: {
            h1: { color: 'purple.500' },
            h2: { letterSpacing: 'wide' },
            code: { borderWidth: '1px' },
          },
        },
      }),
    });
    const recipe = system.getSlotRecipe(postkitRecipeKeys.prose) as {
      readonly base?: {
        readonly h1?: { readonly color?: string };
        readonly h2?: { readonly letterSpacing?: string };
        readonly code?: { readonly borderWidth?: string };
      };
    };

    expect(recipe.base?.h1?.color).toBe('purple.500');
    expect(recipe.base?.h2?.letterSpacing).toBe('wide');
    expect(recipe.base?.code?.borderWidth).toBe('1px');
  });

  it('assigns body, heading, and mono roles across Postkit recipes', () => {
    const system = createPostkitSystem({ preset: postkitDefaultTheme });
    const prose = system.getSlotRecipe(postkitRecipeKeys.prose) as {
      readonly base?: Record<string, { readonly fontFamily?: string }>;
    };
    const callToAction = system.getSlotRecipe(
      postkitRecipeKeys.callToAction,
    ) as typeof prose;
    const terminal = system.getSlotRecipe(
      postkitRecipeKeys.terminal,
    ) as typeof prose;
    const pullQuote = system.getSlotRecipe(
      postkitRecipeKeys.pullQuote,
    ) as typeof prose;
    const stat = system.getSlotRecipe(postkitRecipeKeys.stat) as typeof prose;

    for (const key of Object.values(postkitRecipeKeys)) {
      const recipe = system.getSlotRecipe(key) as typeof prose;
      expect(recipe.base?.root?.fontFamily).toBe('body');
    }

    expect(prose.base?.root?.fontFamily).toBe('body');
    expect(prose.base?.h1?.fontFamily).toBe('heading');
    expect(prose.base?.h6?.fontFamily).toBe('heading');
    expect(prose.base?.code?.fontFamily).toBe('mono');
    expect(prose.base?.pre?.fontFamily).toBe('mono');

    expect(callToAction.base?.root?.fontFamily).toBe('body');
    expect(callToAction.base?.title?.fontFamily).toBe('heading');
    expect(terminal.base?.root?.fontFamily).toBe('body');
    expect(terminal.base?.title?.fontFamily).toBe('mono');
    expect(terminal.base?.body?.fontFamily).toBe('mono');
    expect(pullQuote.base?.quote?.fontFamily).toBe('heading');
    expect(stat.base?.value?.fontFamily).toBe('heading');
  });

  it('configures each font role through either Postkit or Chakra tokens', () => {
    const contextSystem = createPostkitSystem({
      system: defaultSystem,
      preset: postkitDefaultTheme,
      theme: createPostkitTheme({
        typography: {
          body: '"Postkit Body", sans-serif',
          heading: '"Postkit Heading", serif',
          mono: '"Postkit Mono", monospace',
        },
        prose: {
          base: {
            h1: { fontFamily: 'display' },
          },
        },
      }),
    });
    const siteSystem = createPostkitSystem(
      createSystem(defaultConfig, {
        theme: {
          tokens: {
            fonts: {
              body: { value: '"Site Body", sans-serif' },
              heading: { value: '"Site Heading", serif' },
              mono: { value: '"Site Mono", monospace' },
            },
          },
        },
      }),
    );
    const contextProse = contextSystem.getSlotRecipe(
      postkitRecipeKeys.prose,
    ) as {
      readonly base?: Record<string, { readonly fontFamily?: string }>;
    };

    expect(contextSystem.token('fonts.body')).toBe(
      '"Postkit Body", sans-serif',
    );
    expect(contextSystem.token('fonts.heading')).toBe(
      '"Postkit Heading", serif',
    );
    expect(contextSystem.token('fonts.mono')).toBe('"Postkit Mono", monospace');
    expect(contextProse.base?.root?.fontFamily).toBe('body');
    expect(contextProse.base?.h1?.fontFamily).toBe('display');
    expect(contextProse.base?.h2?.fontFamily).toBe('heading');
    expect(contextProse.base?.code?.fontFamily).toBe('mono');

    expect(siteSystem.token('fonts.body')).toBe('"Site Body", sans-serif');
    expect(siteSystem.token('fonts.heading')).toBe('"Site Heading", serif');
    expect(siteSystem.token('fonts.mono')).toBe('"Site Mono", monospace');
  });

  it('layers site-wide rich-component styles before context overrides', () => {
    const siteSystem = createPostkitSystem({
      system: defaultSystem,
      preset: postkitDefaultTheme,
      theme: createPostkitTheme({
        carousel: {
          base: {
            root: {
              background: 'blue.50',
              boxShadow: 'sm',
            },
          },
        },
      }),
    });
    const contextSystem = createPostkitSystem(
      siteSystem,
      createPostkitTheme({
        carousel: {
          base: {
            root: {
              background: 'purple.50',
            },
          },
        },
      }),
    );
    const siteRecipe = siteSystem.getSlotRecipe(postkitRecipeKeys.carousel) as {
      readonly base?: {
        readonly root?: {
          readonly background?: string;
          readonly boxShadow?: string;
        };
      };
    };
    const contextRecipe = contextSystem.getSlotRecipe(
      postkitRecipeKeys.carousel,
    ) as typeof siteRecipe;

    expect(siteRecipe.base?.root).toMatchObject({
      background: 'blue.50',
      boxShadow: 'sm',
    });
    expect(contextRecipe.base?.root).toMatchObject({
      background: 'purple.50',
      boxShadow: 'sm',
    });
  });
});
