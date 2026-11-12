// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { postkitBuiltInDefinitions } from '@postkit/core/components';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';

import {
  buildPostkitStylesheet,
  postkitStyleSources,
} from '../../scripts/build-styles.mjs';

const sourceRoot = new URL('../', import.meta.url);
const definitions = Object.values(postkitBuiltInDefinitions);

function readSource(source: string): string {
  return readFileSync(fileURLToPath(new URL(source, sourceRoot)), 'utf8');
}

function kebab(name: string): string {
  return name.replace(/(?<!^)[A-Z]/g, (letter) => `-${letter}`).toLowerCase();
}

function scopeOf(node: Rule): AtRule | undefined {
  let parent = node.parent;
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule' && (parent as AtRule).name === 'scope') {
      return parent as AtRule;
    }
    parent = parent.parent;
  }
  return undefined;
}

function scopedComponent(scope: AtRule): string | undefined {
  return /^\(\[data-postkit-component='(\w+)'\]/.exec(scope.params)?.[1];
}

/** `:where(…)`, optionally followed by a pseudo-element: zero specificity. */
function hasZeroSpecificity(selector: string): boolean {
  if (!selector.startsWith(':where(')) return false;
  let depth = 0;
  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (character === '(') depth += 1;
    if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return /^(::[a-z-]+)?$/.test(selector.slice(index + 1));
      }
    }
  }
  return false;
}

// --- Colour maths (WCAG 2.x relative luminance). ---

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Token blocks. ---

const tokensRoot = postcss.parse(readSource('styles/tokens.css'));

function tokenBlock(selector: string, inMedia = false): Map<string, string> {
  const block = new Map<string, string>();
  tokensRoot.walkRules((rule) => {
    const isInMedia = rule.parent?.type === 'atrule';
    if (rule.selector !== selector || isInMedia !== inMedia) return;
    rule.walkDecls((declaration) => {
      block.set(declaration.prop, declaration.value);
    });
  });
  return block;
}

const light = tokenBlock(':where(:root)');
const darkMedia = tokenBlock(
  ":where(:root:not(.light, [data-theme='light']))",
  true,
);
const darkClass = tokenBlock(":where(.dark, [data-theme='dark'])");
const lightClass = tokenBlock(":where(.light, [data-theme='light'])");
const hexColor = /^#[0-9a-f]{6}$/i;
const colorTokens = [...light].filter(([, value]) => hexColor.test(value));

describe('styles.css', () => {
  let stylesheet: string;
  let root: Root;

  beforeAll(async () => {
    stylesheet = await buildPostkitStylesheet();
    root = postcss.parse(stylesheet, { from: 'styles.css' });
  });

  it('parses, and starts with the tokens and shared prose rules', async () => {
    expect(root.nodes.length).toBeGreaterThan(0);
    const sources = await postkitStyleSources();
    expect(sources.slice(0, 2)).toEqual([
      'styles/tokens.css',
      'styles/prose.css',
    ]);
    for (const source of sources) {
      expect(() => postcss.parse(readSource(source))).not.toThrow();
    }
  });

  it('has a root rule for every component with a definition', () => {
    const rooted = new Set<string>();
    root.walkRules((rule) => {
      const scope = scopeOf(rule);
      const component = scope && scopedComponent(scope);
      if (component && rule.selectors.includes(':where(:scope)')) {
        rooted.add(component);
      }
    });
    expect(definitions.filter(({ name }) => !rooted.has(name))).toEqual([]);
  });

  it('keeps each component in its own slice, keyed by the anatomy', () => {
    for (const definition of definitions) {
      const source = `components/${kebab(definition.name)}/${kebab(definition.name)}.css`;
      const slice = postcss.parse(readSource(source));
      const props = definition.props as Record<
        string,
        { readonly values?: readonly string[] }
      >;
      slice.walkRules((rule) => {
        const scope = scopeOf(rule);
        // Every rule sits in the component's scope, skips unstyled
        // instances and stops at a nested component.
        expect(scope?.params, `${source}: ${rule.selector}`).toBe(
          `([data-postkit-component='${definition.name}']:not([data-postkit-unstyled])) to ([data-postkit-component])`,
        );
        for (const selector of rule.selectors) {
          expect(hasZeroSpecificity(selector), `${source}: ${selector}`).toBe(
            true,
          );
          // Another component's anatomy is only ever context, never styled.
          if (selector.includes('data-postkit-component=')) continue;
          for (const [, part] of selector.matchAll(
            /data-postkit-part='(\w+)'/g,
          )) {
            expect(definition.slots, `${source}: ${selector}`).toContain(part);
          }
          for (const [, attribute, value] of selector.matchAll(
            /data-([a-z-]+)='([^']+)'/g,
          )) {
            const prop = attribute!.replace(/-([a-z])/g, (_, letter: string) =>
              letter.toUpperCase(),
            );
            if (!definition.themeVariants.includes(prop as never)) continue;
            expect(props[prop]?.values, `${source}: ${selector}`).toContain(
              value,
            );
          }
        }
      });
      if (props['variant']?.values?.length) {
        expect(readSource(source), source).toContain(
          "[data-variant='outline']",
        );
      }
    }
  });

  it('keys the shared rules by the anatomy and skips unstyled instances', () => {
    const prose = postcss.parse(readSource('styles/prose.css'));
    prose.walkRules((rule) => {
      expect(scopeOf(rule)?.params).toBe(
        '([data-postkit-component]:not([data-postkit-unstyled])) to ([data-postkit-component])',
      );
      for (const selector of rule.selectors) {
        expect(hasZeroSpecificity(selector), selector).toBe(true);
      }
    });
  });

  it('takes every colour from a --postkit-* token outside the token blocks', () => {
    const rawColor =
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|silver|navy|teal|maroon|olive|lime|aqua|fuchsia|darkorange|canvas|canvastext)\b/i;
    const colorProperty =
      /^(?:color|background(?:-color)?|border(?:-(?:block|inline|top|right|bottom|left)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|text-decoration(?:-color)?|caret-color|accent-color|column-rule(?:-color)?)$/;
    const allowedWord =
      /^(?:-?\d*\.?\d+(?:px|rem|em|%)?|0|none|transparent|currentcolor|inherit|solid|inset|auto)$/i;
    const offenders: string[] = [];
    root.walkDecls((declaration) => {
      if (declaration.prop.startsWith('--postkit-')) {
        const rule = declaration.parent as Rule;
        if (!scopeOf(rule)) return; // the token blocks
      }
      const value = declaration.value;
      if (rawColor.test(value)) {
        offenders.push(`${declaration.prop}: ${value}`);
        return;
      }
      if (!colorProperty.test(declaration.prop)) return;
      const words = value
        .replace(/var\(--postkit-[a-z0-9-]+\)/g, ' ')
        .replace(/calc\([^)]*\)/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      for (const word of words) {
        if (!allowedWord.test(word)) {
          offenders.push(`${declaration.prop}: ${value}`);
        }
      }
    });
    expect(offenders).toEqual([]);
  });

  it("never sets or reads Chakra's variables", () => {
    expect(stylesheet).not.toContain('--chakra-');
    for (const index of [1, 2, 3, 4]) {
      expect(light.get(`--postkit-chart-${index}`)).toMatch(hexColor);
    }
  });

  it('gives every colour token a dark value, in both dark selectors', () => {
    expect(colorTokens.length).toBeGreaterThan(20);
    for (const [token] of colorTokens) {
      expect(darkMedia.get(token), token).toMatch(hexColor);
      expect(darkClass.get(token), token).toBe(darkMedia.get(token));
      expect(lightClass.get(token), token).toBe(light.get(token));
    }
    expect(darkMedia.get('--postkit-color-scheme')).toBe('dark');
    expect(darkClass.get('--postkit-color-scheme')).toBe('dark');
    expect([...darkMedia.keys()].sort()).toEqual([...darkClass.keys()].sort());
  });

  it('reserves the footnote and sidenote tokens (§7.1)', () => {
    const tokens = new Set<string>();
    tokensRoot.walkDecls((declaration) => {
      tokens.add(declaration.prop);
    });
    for (const name of [
      'accent',
      'marker-color',
      'marker-size',
      'number-color',
      'number-size',
      'text-size',
      'text-color',
      'rule',
      'rule-width',
      'target-bg',
    ]) {
      expect(tokens).toContain(`--postkit-footnote-${name}`);
    }
    expect(light.get('--postkit-sidenote-width')).toBe('232px');
    expect(light.get('--postkit-sidenote-gap')).toBe('48px');
  });

  describe.each([
    ['light', light],
    ['dark', darkMedia],
  ] as const)('contrast in %s mode', (_, mode) => {
    const token = (name: string) => {
      const value = mode.get(`--postkit-${name}`);
      if (!value || !hexColor.test(value))
        throw new Error(`No ${name} colour.`);
      return value;
    };
    const tones = ['note', 'tip', 'important', 'warning', 'caution'];
    const textPairs: readonly (readonly [string, string])[] = [
      ['color-fg', 'color-bg'],
      ['color-fg', 'color-surface'],
      ['color-fg', 'color-surface-emphasized'],
      ['color-fg', 'color-highlight'],
      ['color-fg-muted', 'color-bg'],
      ['color-fg-muted', 'color-surface'],
      ['color-fg-muted', 'color-surface-emphasized'],
      ['color-fg-muted', 'color-highlight'],
      ['color-accent-fg', 'color-accent'],
      ['color-on-letterbox', 'color-letterbox'],
      ...tones.flatMap((tone) => [
        [`tone-${tone}`, 'color-bg'] as const,
        [`tone-${tone}`, 'color-surface'] as const,
        [`tone-${tone}`, `tone-${tone}-surface`] as const,
        ['color-fg', `tone-${tone}-surface`] as const,
        ['color-fg-muted', `tone-${tone}-surface`] as const,
      ]),
      ['code-fg', 'code-bg'],
      ['code-fg', 'code-header-bg'],
      ['code-fg', 'code-selected'],
      ['code-fg-muted', 'code-bg'],
      ['code-fg-muted', 'code-header-bg'],
      ['code-success', 'code-bg'],
    ];
    const nonTextPairs: readonly (readonly [string, string])[] = [
      ['color-border-strong', 'color-bg'],
      ['color-focus-ring', 'color-bg'],
      ['color-focus-ring', 'color-surface'],
      ['code-focus-ring', 'code-bg'],
      ...[1, 2, 3, 4].flatMap((series) => [
        [`chart-${series}`, 'color-bg'] as const,
        [`chart-${series}`, 'color-surface'] as const,
      ]),
    ];

    it.each(textPairs)('%s on %s is at least 4.5:1', (fg, bg) => {
      expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
    it.each(nonTextPairs)('%s against %s is at least 3:1', (fg, bg) => {
      expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3);
    });
  });
});
