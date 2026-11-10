/**
 * @jest-environment jsdom
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SystemContext } from '@chakra-ui/react';
import { render } from '@testing-library/react';

import { Callout } from '../components/callout/callout.js';
import { Terminal } from '../components/terminal/terminal.js';
import { PostkitProvider } from './provider.js';
import { postkitCodeBlockRecipe } from '../components/code-block/code-block.recipe.js';
import { postkitCodeGroupRecipe } from '../components/code-group/code-group.recipe.js';
import { postkitTerminalRecipe } from '../components/terminal/terminal.recipe.js';
import {
  createPostkitSystem,
  postkitDefaultTheme,
  postkitRecipeKeys,
} from './theme.js';

globalThis.structuredClone ??= <T,>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

/**
 * Recipes allowed to use colours that are the same in both modes: the code
 * surfaces keep their own dark surface, and video letterboxing stays black
 * (03-component-system §5.5).
 */
const modeInvariantRecipes = new Set<string>([
  postkitRecipeKeys.codeBlock,
  postkitRecipeKeys.codeGroup,
  postkitRecipeKeys.terminal,
  postkitRecipeKeys.video,
]);

const colorProperty =
  /^(color|background|backgroundColor|bg|bgColor|fill|stroke|boxShadow|textShadow)$|Color$/;
const colorKeywords = new Set([
  'currentColor',
  'inherit',
  'initial',
  'none',
  'transparent',
  'unset',
]);

interface ColorUse {
  readonly path: string;
  readonly property: string;
  readonly value: string;
}

function colorUses(node: unknown, path: string): ColorUse[] {
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) => {
    if (typeof value === 'string' && colorProperty.test(key)) {
      return [{ path: `${path}.${key}`, property: key, value }];
    }
    return colorUses(value, `${path}.${key}`);
  });
}

function recipeColorUses(recipe: object, name: string): ColorUse[] {
  const { base, variants, compoundVariants } = recipe as Record<
    string,
    unknown
  >;
  return colorUses({ base, variants, compoundVariants }, name);
}

type TokenConditions = Readonly<Record<string, string>>;

function tokenConditions(
  system: SystemContext,
  name: string,
): TokenConditions | undefined {
  return system.tokens.getByName(`colors.${name}`)?.extensions?.conditions as
    TokenConditions | undefined;
}

function tokenNameForVar(
  system: SystemContext,
  cssVar: string,
): string | undefined {
  return system.tokens.allTokens
    .find((token) => token.extensions?.cssVar?.var === cssVar)
    ?.name.replace(/^colors\./, '');
}

/**
 * Returns why a recipe colour does not follow the colour mode, or undefined
 * when it does: a keyword, a colorPalette reference, or a semantic token with
 * a dark value.
 */
function colorProblem(
  system: SystemContext,
  recipeName: string,
  { property, value }: ColorUse,
): string | undefined {
  if (colorKeywords.has(value) || value.startsWith('colorPalette.')) return;
  if (/shadow/i.test(property) && system.tokens.getByName(`shadows.${value}`)) {
    return;
  }

  const variables = [...value.matchAll(/var\((--chakra-colors-[\w-]+)/g)].map(
    ([, cssVar]) => cssVar,
  );
  const names = variables.length
    ? variables
        // colorPalette variables follow the palette's own semantic tokens.
        .filter(
          (cssVar) => !cssVar.startsWith('--chakra-colors-color-palette-'),
        )
        .map((cssVar) => tokenNameForVar(system, cssVar))
    : [value];

  for (const name of names) {
    if (!name) return `references an unknown colour variable`;
    const conditions = tokenConditions(system, name);
    if (!conditions) return `"${name}" is not a semantic colour token`;
    if (!('_dark' in conditions)) return `"${name}" has no _dark value`;
    const light = conditions['base'] ?? conditions['_light'];
    if (light === conditions['_dark'] && !modeInvariantRecipes.has(recipeName))
      return `"${name}" is the same in both modes outside the documented exceptions`;
  }
  return;
}

describe('Postkit dark mode', () => {
  describe('recipes use semantic colours only', () => {
    const recipeDirectory = join(__dirname, 'recipes');
    const recipeFiles = readdirSync(recipeDirectory).filter((file) =>
      file.endsWith('.recipe.ts'),
    );

    it.each(recipeFiles)('%s has no raw colour literals', (file) => {
      const source = readFileSync(join(recipeDirectory, file), 'utf8')
        // Comments may name raw colours when explaining a choice.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source).not.toMatch(/\b(rgba?|hsla?|oklch|oklab|hwb)\(/);
      expect(source).not.toMatch(/['"](white|black)['"]/);
      expect(source).not.toMatch(
        /['"](gray|red|orange|yellow|green|teal|blue|cyan|purple|pink|whiteAlpha|blackAlpha)\.\d+['"]/,
      );
    });

    it('resolves every preset recipe colour to a mode-aware token', () => {
      const system = createPostkitSystem({ preset: postkitDefaultTheme });
      const problems = Object.values(postkitRecipeKeys).flatMap((key) =>
        recipeColorUses(system.getSlotRecipe(key), key).flatMap((use) => {
          const problem = colorProblem(system, key, use);
          return problem ? [`${use.path}: ${problem}`] : [];
        }),
      );

      expect(problems).toEqual([]);
    });

    it('keeps host-native fallback recipes on Chakra tokens alone', () => {
      // These render without the preset, so they must not depend on its tokens.
      const system = createPostkitSystem();
      const problems = (
        [
          [postkitRecipeKeys.codeBlock, postkitCodeBlockRecipe],
          [postkitRecipeKeys.codeGroup, postkitCodeGroupRecipe],
          [postkitRecipeKeys.terminal, postkitTerminalRecipe],
        ] as const
      ).flatMap(([key, recipe]) =>
        recipeColorUses(recipe, key).flatMap((use) => {
          const problem = colorProblem(system, 'host-native', use);
          return problem ? [`${use.path}: ${problem}`] : [];
        }),
      );

      expect(problems).toEqual([]);
    });
  });

  it('gives every postkitDefaultTheme semantic colour a _light and _dark value', () => {
    const colors = postkitDefaultTheme.theme?.semanticTokens?.colors;
    const leaves: Array<[string, unknown]> = [];
    const walk = (node: unknown, path: string) => {
      if (!node || typeof node !== 'object') return;
      if ('value' in node) {
        leaves.push([path, (node as { value: unknown }).value]);
        return;
      }
      for (const [key, child] of Object.entries(node)) {
        walk(child, path ? `${path}.${key}` : key);
      }
    };
    walk(colors, '');

    expect(leaves.length).toBeGreaterThan(0);
    for (const [path, value] of leaves) {
      expect({ path, value }).toEqual({
        path,
        value: { _light: expect.any(String), _dark: expect.any(String) },
      });
    }
    // Tints are computed from their tone, so host tones get matching tints.
    for (const tone of ['note', 'tip', 'important', 'warning', 'caution']) {
      expect(leaves).toContainEqual([
        `tint.${tone}`,
        {
          _light: `color-mix(in srgb, {colors.tone.${tone}} 12%, {colors.bg})`,
          _dark: `color-mix(in srgb, {colors.tone.${tone}} 22%, {colors.bg})`,
        },
      ]);
    }
  });

  describe('rendering', () => {
    /** Style rules in document order, including those inside @layer blocks. */
    function styleRules(): CSSStyleRule[] {
      const collect = (rules: CSSRuleList): CSSStyleRule[] =>
        Array.from(rules).flatMap((rule) => [
          ...('selectorText' in rule ? [rule as CSSStyleRule] : []),
          ...('cssRules' in rule && (rule as CSSGroupingRule).cssRules
            ? collect((rule as CSSGroupingRule).cssRules)
            : []),
        ]);
      return Array.from(document.styleSheets).flatMap((sheet) =>
        collect(sheet.cssRules),
      );
    }

    function matches(element: Element, selector: string): boolean {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    }

    /**
     * jsdom does not substitute var(), so this applies the cascade for the
     * declarations Chakra emits: the last matching rule wins, and custom
     * properties inherit from the nearest ancestor that declares them.
     */
    function declared(element: Element, property: string): string | undefined {
      const rules = styleRules();
      for (
        let current: Element | null = element;
        current;
        current = current.parentElement
      ) {
        const value = rules
          .filter(
            (rule) =>
              rule.style.getPropertyValue(property) &&
              matches(current as Element, rule.selectorText),
          )
          .at(-1)
          ?.style.getPropertyValue(property);
        if (value) return value.trim();
        if (!property.startsWith('--')) return undefined;
      }
      return undefined;
    }

    function resolved(element: Element, property: string): string | undefined {
      const substitute = (value: string, depth = 0): string =>
        depth > 20
          ? value
          : value.replace(/var\((--[\w-]+)\)/g, (_, name: string) =>
              substitute(declared(element, name) ?? `var(${name})`, depth + 1),
            );
      const value = declared(element, property);
      return value === undefined ? undefined : substitute(value);
    }

    function renderInMode(mode: 'light' | 'dark') {
      return render(
        <div className={mode}>
          <PostkitProvider preset={postkitDefaultTheme}>
            <Callout tone="note" title="Note">
              Body
            </Callout>
            <Terminal command="npm test" />
          </PostkitProvider>
        </div>,
      );
    }

    it('applies dark token values inside a .dark container', () => {
      const light = renderInMode('light');
      const lightIcon = light.container.querySelector(
        '.postkit-callout__icon',
      ) as Element;
      const lightCallout = light.container.querySelector(
        '.postkit-callout__root',
      ) as Element;
      const lightTerminal = light.container.querySelector(
        '.postkit-terminal__root',
      ) as Element;

      const dark = renderInMode('dark');
      const darkIcon = dark.container.querySelector(
        '.postkit-callout__icon',
      ) as Element;
      const darkCallout = dark.container.querySelector(
        '.postkit-callout__root',
      ) as Element;
      const darkTerminal = dark.container.querySelector(
        '.postkit-terminal__root',
      ) as Element;

      // The tone and its computed tint flip with the container's mode.
      expect(declared(darkIcon, 'background')).toBe(
        'var(--chakra-colors-tint-note)',
      );
      expect(resolved(lightIcon, 'color')).toBe('#173da6');
      expect(resolved(darkIcon, 'color')).toBe('#a3cfff');
      expect(resolved(lightIcon, 'background')).toBe(
        'color-mix(in srgb, #173da6 12%, #FFFFFF)',
      );
      expect(resolved(darkIcon, 'background')).toBe(
        'color-mix(in srgb, #a3cfff 22%, #09090B)',
      );

      // A subtle callout fills with its tone's tint, not a grey surface.
      expect(declared(lightCallout, 'background')).toBe(
        'var(--chakra-colors-tint-note)',
      );
      expect(resolved(lightCallout, 'background')).toBe(
        'color-mix(in srgb, #173da6 12%, #FFFFFF)',
      );
      expect(resolved(darkCallout, 'background')).toBe(
        'color-mix(in srgb, #a3cfff 22%, #09090B)',
      );

      // The terminal keeps its own dark surface in both modes.
      expect(resolved(lightTerminal, 'background')).toBe('#111111');
      expect(resolved(darkTerminal, 'background')).toBe('#111111');
    });

    it.each(['light', 'dark'] as const)(
      'fills every subtle callout tone with its tint in %s mode',
      (mode) => {
        const tones = [
          'note',
          'tip',
          'important',
          'warning',
          'caution',
        ] as const;
        const { container } = render(
          <div className={mode}>
            <PostkitProvider preset={postkitDefaultTheme}>
              {tones.map((tone) => (
                <Callout key={tone} tone={tone} variant="subtle" title={tone}>
                  Body
                </Callout>
              ))}
              <Callout tone="tip" variant="outline">
                Outline
              </Callout>
            </PostkitProvider>
          </div>,
        );
        const roots = Array.from(
          container.querySelectorAll('.postkit-callout__root'),
        );
        const share = mode === 'light' ? '12%' : '22%';
        const page = mode === 'light' ? '#FFFFFF' : '#09090B';
        const toneColors = {
          light: ['#173da6', '#116932', '#641ba3', '#92310a', '#991919'],
          dark: ['#a3cfff', '#86efac', '#d8b4fe', '#fdba74', '#fca5a5'],
        }[mode];

        expect(
          roots
            .slice(0, tones.length)
            .map((root) => declared(root, 'background')),
        ).toEqual(tones.map((tone) => `var(--chakra-colors-tint-${tone})`));
        expect(
          roots
            .slice(0, tones.length)
            .map((root) => resolved(root, 'background')),
        ).toEqual(
          toneColors.map(
            (color) => `color-mix(in srgb, ${color} ${share}, ${page})`,
          ),
        );
        // Only the subtle variant is filled.
        expect(declared(roots[tones.length], 'background')).not.toMatch(/tint/);
      },
    );
  });

  it('emits the light colour-mode block before the dark one', () => {
    // Chakra writes colour-mode blocks in the order it first meets each condition. If the
    // dark block comes first, `:root, .light` wins on <html class="dark"> and dark mode
    // never shows. Check with Chakra's own tokens underneath, as a host has them.
    const system = createPostkitSystem({ preset: postkitDefaultTheme });
    const tokenCss = system.getTokenCss() as unknown as Record<
      string,
      Record<string, unknown>
    >;
    const blocks = Object.keys(tokenCss['@layer tokens'] ?? {});
    const light = blocks.findIndex((selector) => selector.includes('.light'));
    const dark = blocks.findIndex((selector) => selector.includes('.dark'));
    expect(light).toBeGreaterThanOrEqual(0);
    expect(dark).toBeGreaterThan(light);
  });
});
