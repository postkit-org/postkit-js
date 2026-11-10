import type { SystemContext } from '@chakra-ui/react';

import { postkitDefaultSocialServices } from './social-services.js';
import { createPostkitSystem, postkitDefaultTheme } from './theme.js';

globalThis.structuredClone ??= <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

type Mode = '_light' | '_dark';
type Rgb = readonly [number, number, number];

function parseHex(value: string): Rgb {
  const hex = value.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : hex.slice(0, 6);
  return [0, 2, 4].map((index) =>
    Number.parseInt(full.slice(index, index + 2), 16),
  ) as unknown as Rgb;
}

/**
 * Resolves a colour token to sRGB for one colour mode, following token
 * references and the `color-mix(in srgb, …)` the tints are computed with.
 */
function resolveColor(system: SystemContext, value: string, mode: Mode): Rgb {
  const expression = value.trim();
  const mix = expression.match(
    /^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/,
  );
  if (mix) {
    const [, first, percent, second] = mix;
    const weight = Number(percent) / 100;
    const a = resolveColor(system, first, mode);
    const b = resolveColor(system, second, mode);
    return a.map((channel, index) =>
      Math.round(channel * weight + b[index] * (1 - weight)),
    ) as unknown as Rgb;
  }
  if (expression.startsWith('#')) return parseHex(expression);

  const name = expression.replace(/^\{colors\.(.+)\}$/, '$1');
  const token = system.tokens.getByName(`colors.${name}`);
  if (!token) throw new Error(`Unknown colour token "${name}"`);
  const conditions = token.extensions?.conditions as
    Record<string, string> | undefined;
  const raw = conditions
    ? (conditions[mode] ?? conditions['base'])
    : String(token.originalValue);
  return resolveColor(system, raw, mode);
}

function luminance([red, green, blue]: Rgb): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const tones = ['note', 'tip', 'important', 'warning', 'caution'] as const;
const cardSurfaces = ['bg', 'bg.muted', 'bg.subtle'];

/**
 * Text colour and surface pairs the default recipes put together for the
 * colour fixes in 06-work-breakdown P4, P5 and P11.
 */
const pairs: ReadonlyArray<readonly [what: string, fg: string, bg: string]> = [
  // LinkPreview domain, Figure credit, AppearsOn status, NewsletterSignup
  // privacy line, SocialPost timestamp, snapshot info and subtle badge.
  ...cardSurfaces.map(
    (bg) => ['muted text on a card surface', 'fg.muted', bg] as const,
  ),
  // KeyTakeaway body on its tint (Chakra's info palette).
  ['KeyTakeaway body', 'fg', 'blue.subtle'],
  // Subtle Callout: body and tone mark on the tone's tint.
  ...tones.flatMap((tone) => [
    [`Callout ${tone} body`, 'fg', `tint.${tone}`] as const,
    [`Callout ${tone} mark`, `tone.${tone}`, `tint.${tone}`] as const,
  ]),
  // AppearsOn, ShareActions and SocialPost service labels.
  ...[
    ...new Set(
      Object.values(postkitDefaultSocialServices).flatMap((service) =>
        service.accent ? [service.accent] : [],
      ),
    ),
  ].flatMap((accent) =>
    [...cardSurfaces, 'bg.emphasized'].map(
      (bg) => [`${accent} service label`, accent, bg] as const,
    ),
  ),
  // ShareActions buttons, at rest and hovered.
  ...[...cardSurfaces, 'bg.emphasized'].map(
    (bg) => ['ShareActions button', 'fg', bg] as const,
  ),
  // LinkPreview consent text, before the scrim is mixed over the image.
  ['LinkPreview consent (light)', 'fg.inverted', 'bg.inverted'],
  ['LinkPreview consent (dark)', 'fg', 'bg'],
];

describe('colour contrast of the default theme', () => {
  const system = createPostkitSystem({ preset: postkitDefaultTheme });

  it.each(['_light', '_dark'] as const)(
    'keeps text at 4.5:1 or more in %s mode',
    (mode) => {
      const failures = pairs.flatMap(([what, fg, bg]) => {
        const ratio = contrast(
          resolveColor(system, fg, mode),
          resolveColor(system, bg, mode),
        );
        return ratio >= 4.5
          ? []
          : [`${what}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`];
      });

      expect(failures).toEqual([]);
    },
  );

  it('resolves the computed tints for the check', () => {
    expect(resolveColor(system, 'tint.note', '_light')).not.toEqual(
      resolveColor(system, 'tint.note', '_dark'),
    );
    // Chakra's blue.700 over white at 12%.
    expect(resolveColor(system, 'tint.note', '_light')).toEqual(
      resolveColor(
        system,
        'color-mix(in srgb, #173da6 12%, #ffffff)',
        '_light',
      ),
    );
  });
});
