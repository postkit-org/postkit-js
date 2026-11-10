import { defaultSystem } from '@chakra-ui/react';

import { siteSystem } from '../theme';
import { siteRecipes, siteSlotRecipes } from './index';

const tokenKeys = ['bg', 'color', 'boxShadow', 'outlineColor'] as const;

/** Every colour or shadow value a recipe names, however deeply it's nested. */
function collectValues(node: unknown, found = new Set<string>()): Set<string> {
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (
        typeof value === 'string' &&
        (tokenKeys as readonly string[]).includes(key)
      ) {
        found.add(value);
      } else {
        collectValues(value, found);
      }
    }
  }
  return found;
}

const ignored = new Set(['transparent', 'inherit', 'currentColor']);

type Css = Record<string, unknown>;

/** Recipe functions return resolved CSS inside `@layer recipes`. */
const layer = (css: unknown) =>
  (css as Record<string, Record<string, unknown>>)['@layer recipes'] as Css;
const v = (name: string) => `var(--chakra-${name})`;

const enabled = ':not(:disabled, [data-disabled], [aria-disabled=true])';
const HOVER = '@media (hover: hover)';
const HOVER_SELECTOR = `&:is(:hover, [data-hover]):not(:active, [data-active])${enabled}`;
const PRESS = `&:is(:active, [data-active])${enabled}`;
const MOTION_SAFE = '@media (prefers-reduced-motion: no-preference)';
const DISABLED =
  '&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])';
const FOCUS_VISIBLE = '&:is(:focus-visible, [data-focus-visible])';
const CHECKED =
  '&:is(:checked, [data-checked], [aria-checked=true], [data-state=checked])';

describe('site recipes', () => {
  it.each(Object.keys(siteRecipes))('registers the %s recipe', (key) => {
    expect(siteSystem.isRecipe(key)).toBe(true);
  });

  it.each(Object.keys(siteSlotRecipes))(
    'registers the %s slot recipe',
    (key) => {
      expect(siteSystem.isSlotRecipe(key)).toBe(true);
    },
  );

  it("leaves Chakra's own button, kbd, input and segmentGroup recipes alone", () => {
    for (const key of ['button', 'kbd', 'input']) {
      expect(siteSystem.getRecipe(key)).toEqual(defaultSystem.getRecipe(key));
    }
    expect(siteSystem.getSlotRecipe('segmentGroup')).toEqual(
      defaultSystem.getSlotRecipe('segmentGroup'),
    );
  });

  it('gives Button primary and secondary variants in two sizes', () => {
    const button = siteSystem.getRecipeFn('siteButton');
    expect(button.variantMap).toEqual({
      variant: ['primary', 'secondary'],
      size: ['md', 'lg'],
    });

    const primary = layer(button({ variant: 'primary' }));
    expect(primary).toMatchObject({
      background: v('colors-bg-inverted'),
      color: v('colors-fg-inverted'),
      borderRadius: v('radii-full'),
      minHeight: '40px',
      transitionDuration: v('durations-hover'),
    });
    expect(primary[HOVER]).toEqual({
      [HOVER_SELECTOR]: expect.objectContaining({
        background: v('colors-bg-inverted-hover'),
      }),
    });
    expect(primary[PRESS]).toMatchObject({
      background: v('colors-bg-inverted-pressed'),
    });
    expect(primary[MOTION_SAFE]).toEqual({
      [PRESS]: { transform: 'scale(0.98)' },
    });
    expect(primary[DISABLED]).toMatchObject({ opacity: 0.35 });
    expect(primary[FOCUS_VISIBLE]).toMatchObject({
      outlineColor: v('colors-accent'),
      outlineOffset: '2px',
    });

    const secondary = layer(button({ variant: 'secondary', size: 'lg' }));
    expect(secondary).toMatchObject({
      background: v('colors-bg-subtle'),
      minHeight: '48px',
    });
    expect(secondary[PRESS]).toMatchObject({
      background: v('colors-bg-pressed'),
    });
    expect(secondary[DISABLED]).toMatchObject({ opacity: 0.45 });
  });

  it('gives the slot recipes their slots and variants', () => {
    const segmented = siteSystem.getSlotRecipeFn('siteSegmentedControl');
    expect(Object.keys(segmented({}))).toEqual(['root', 'item']);
    expect(layer(segmented({}).root)).toMatchObject({
      background: v('colors-bg-subtle'),
    });
    expect(layer(segmented({}).item)[CHECKED]).toMatchObject({
      background: v('colors-bg-raised'),
      boxShadow: v('shadows-segment'),
    });
    expect(segmented.variantMap).toEqual({
      size: ['md', 'icon'],
      fullWidth: ['true', 'false'],
    });
    const icon = segmented({ size: 'icon' });
    expect(layer(icon.root)).toMatchObject({ padding: '2px' });
    expect(layer(icon.item)).toMatchObject({
      width: '30px',
      height: '24px',
      color: v('colors-fg-quiet'),
    });

    const field = siteSystem.getSlotRecipeFn('siteTextField');
    expect(field.variantMap).toEqual({
      size: ['md', 'lg'],
      shape: ['rounded', 'pill'],
      surface: ['page', 'subtle'],
    });
    expect(Object.keys(field({}))).toEqual([
      'root',
      'label',
      'input',
      'error',
      'errorBadge',
    ]);
    expect(layer(field({ surface: 'subtle' }).input)).toMatchObject({
      background: v('colors-bg-raised'),
      borderRadius: v('radii-lg'),
    });

    const kbd = layer(siteSystem.getRecipeFn('siteKbd')({}));
    expect(kbd).toMatchObject({
      height: '20px',
      borderRadius: '6px',
      background: v('colors-bg-kbd'),
      boxShadow: v('shadows-kbd'),
    });

    const tile = siteSystem.getSlotRecipeFn('siteTile');
    expect(tile.classNameMap).toMatchObject({ root: 'site-tile__root' });
    expect(Object.keys(tile({}))).toEqual([
      'root',
      'preview',
      'label',
      'chevron',
      'description',
    ]);
  });

  it('names only colour and shadow tokens the system defines', () => {
    const all = { ...siteRecipes, ...siteSlotRecipes };
    for (const value of collectValues(all)) {
      if (ignored.has(value)) continue;
      expect(value).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
      const refs = [...value.matchAll(/\{(colors\.[\w.]+)\}/g)].map(
        (m) => m[1],
      );
      const names = refs.length
        ? refs
        : [`colors.${value}`, `shadows.${value}`];
      expect(
        names.some((name) => siteSystem.tokens.getByName(name) !== undefined),
      ).toBe(true);
    }
  });

  it('resolves token references inside the text field rings', () => {
    const field = siteSystem.getSlotRecipeFn('siteTextField');
    const css = siteSystem.css(field({}).input) as Record<string, unknown>;
    expect(JSON.stringify(css)).toContain('var(--chakra-colors-accent)');
    expect(JSON.stringify(css)).toContain('var(--chakra-colors-tone-caution)');
  });
});
