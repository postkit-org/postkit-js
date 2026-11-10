import { gradients, siteConfig, siteSystem } from './theme.js';
import { tokens } from './tokens.js';

type ModeValue = { value: { base: string; _dark: string } };
type TokenTree = { [key: string]: ModeValue | TokenTree };

const semanticColors = siteConfig.theme?.semanticTokens?.colors as TokenTree;
const semanticShadows = siteConfig.theme?.semanticTokens?.shadows as TokenTree;

/** Finds `bg.subtle` / `bg` (→ `bg.DEFAULT`) in the nested semantic token tree. */
function lookup(tree: TokenTree, path: string): ModeValue | undefined {
  let node: ModeValue | TokenTree | undefined = tree;
  for (const part of path.split('.')) {
    node = (node as TokenTree | undefined)?.[part];
  }
  if (node && !('value' in node)) {
    node = (node as TokenTree)['DEFAULT'];
  }
  return node as ModeValue | undefined;
}

const colorEntries = Object.entries(tokens.color).filter(
  ([name]) => !name.startsWith('$'),
) as [string, { light: string; dark: string }][];

const toneEntries = Object.entries(tokens.tone).filter(
  ([name]) => !name.startsWith('$'),
) as [
  string,
  { light: string; dark: string; tintLight: string; tintDark: string },
][];

describe('site theme', () => {
  it.each(colorEntries)(
    'colour %s matches tokens.json in light and dark',
    (name, value) => {
      expect(lookup(semanticColors, name)?.value).toEqual({
        base: value.light,
        _dark: value.dark,
      });
    },
  );

  it.each(toneEntries)(
    'tone %s and its tint match tokens.json',
    (name, value) => {
      expect(lookup(semanticColors, `tone.${name}`)?.value).toEqual({
        base: value.light,
        _dark: value.dark,
      });
      expect(lookup(semanticColors, `tint.${name}`)?.value).toEqual({
        base: value.tintLight,
        _dark: value.tintDark,
      });
    },
  );

  it('matches the shadows and gradients in tokens.json', () => {
    for (const [name, value] of Object.entries(tokens.shadow)) {
      if (name.startsWith('$')) continue;
      const { light, dark } = value as { light: string; dark: string };
      expect(lookup(semanticShadows, name)?.value).toEqual({
        base: light,
        _dark: dark,
      });
    }
    for (const name of ['brand', 'brandVertical', 'logo', 'cover'] as const) {
      expect(gradients[name]).toBe(tokens.gradient[name]);
    }
  });

  it('builds a system with the site breakpoints', () => {
    expect(siteSystem.breakpoints.up('md')).toContain('47.5625rem'); // 761px
    expect(siteSystem.breakpoints.up('xl')).toContain('75rem'); // 1200px
    expect(siteSystem.token('colors.bg.subtle')).toBe(
      'var(--chakra-colors-bg-subtle)',
    );
  });
});
