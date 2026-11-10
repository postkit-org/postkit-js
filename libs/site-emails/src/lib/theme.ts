import type { ThemeInput, ThemeScale } from '@chakra-email/core';
import { tokens } from '@postkit/site-theme';

/**
 * postkit.org's raw tokens (`@postkit/site-theme`'s `tokens`, not its Chakra system) in
 * Chakra Email's theme format. Emails are light only (04 §3), so every colour is the
 * token's `light` value.
 *
 * Colour keys are nested by their dots, with `DEFAULT` for the bare name, so `bg`,
 * `bg.subtle` and `fg.muted` all resolve the way they do on the site.
 */
function toEmailColors(
  colors: Record<string, { readonly light: string } | string>,
): ThemeScale {
  const scale: ThemeScale = {};
  for (const [name, token] of Object.entries(colors)) {
    if (typeof token !== 'object' || token === null || !('light' in token)) {
      continue;
    }
    const [group, ...rest] = name.split('.');
    const shade = rest.length > 0 ? rest.join('.') : 'DEFAULT';
    const existing = scale[group];
    const groupScale: ThemeScale =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as ThemeScale)
        : {};
    groupScale[shade] = token.light;
    scale[group] = groupScale;
  }
  return scale;
}

const toneNames = ['note', 'tip', 'important', 'warning', 'caution'] as const;

/**
 * The site's own tones, which differ from `@postkit/email`'s defaults (Chakra's palettes),
 * on the package's `tone.*` and `tint.*` keys, light values only. The site's Chakra
 * components use the same tokens, so a Callout looks the same on the page and in an inbox.
 */
export const emailToneColors = {
  tone: Object.fromEntries(
    toneNames.map((name) => [name, tokens.tone[name].light]),
  ),
  tint: Object.fromEntries(
    toneNames.map((name) => [name, tokens.tone[name].tintLight]),
  ),
} satisfies ThemeScale;

/**
 * The email font stack. The site's own stack starts with Suisse Int'l, which no mail client
 * has; the boards use Inter Tight with system fallbacks.
 */
export const EMAIL_FONT_STACK =
  "'Inter Tight', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Chakra Email theme for the site's emails. */
export const emailTheme: ThemeInput = {
  colors: {
    ...toEmailColors(tokens.color),
    ...emailToneColors,
  },
  fonts: {
    body: EMAIL_FONT_STACK,
    heading: EMAIL_FONT_STACK,
  },
  fontWeights: {
    normal: tokens.fontWeight.regular,
    medium: tokens.fontWeight.medium,
    semibold: tokens.fontWeight.semibold,
  },
  radii: { ...tokens.radius },
  letterSpacings: {
    heading: tokens.letterSpacing.heading,
  },
};

/** The logo pill's gradient. */
export const logoGradient = tokens.gradient.logo;

/**
 * A flat colour for clients that drop CSS gradients (Outlook on Windows): the gradient's
 * middle stop, taken from the token so it can't drift.
 */
export const logoFallbackColor = (() => {
  const stops = logoGradient.match(/#[0-9a-f]{6}/gi) ?? [];
  return stops[Math.floor(stops.length / 2)] ?? tokens.color.fg.light;
})();
