import {
  defaultTheme,
  resolveColor,
  useTheme,
  type EmailTheme,
  type ThemeOverride,
} from '@chakra-email/core';

export type Tone = 'note' | 'tip' | 'important' | 'warning' | 'caution';

export const postkitEmailTones: readonly Tone[] = [
  'note',
  'tip',
  'important',
  'warning',
  'caution',
];

/**
 * Light tone colours, as literal hex so every email client can read them (no
 * CSS variables, no `color-mix()`). `tone` is the light value of
 * `@postkit/chakra`'s `tone.*` (Chakra UI's `<palette>.700`); `tint` is that
 * tone at 12% over white, the light value of its `tint.*`.
 */
const toneColors = {
  tone: {
    note: '#173da6',
    tip: '#116932',
    important: '#641ba3',
    warning: '#92310a',
    caution: '#991919',
  },
  tint: {
    note: '#e3e8f4',
    tip: '#e2ede6',
    important: '#ece4f4',
    warning: '#f2e6e2',
    caution: '#f3e3e3',
  },
} as const satisfies Record<'tone' | 'tint', Record<Tone, string>>;

/** Body text on a tint: Chakra UI's `gray.900`. */
const fgColor = '#18181b';

/**
 * The light Postkit email theme, layered over Chakra Email's defaults by
 * `PostkitEmailProvider`. Hosts override any colour with the same key, such
 * as `{ colors: { tone: { tip: '#23794a' }, tint: { tip: '#e5efe9' } } }`.
 * Email stays light; mail clients apply their own dark mode.
 */
export const postkitEmailTheme = {
  colors: {
    fg: { DEFAULT: fgColor },
    tone: { ...toneColors.tone },
    tint: { ...toneColors.tint },
  },
} as const satisfies ThemeOverride;

/**
 * Resolves a colour token against the active theme to a literal value. Inline
 * shorthands such as `border-left` aren't resolved by Chakra Email, and a token
 * the theme doesn't define would otherwise reach the HTML as its raw name, so a
 * miss falls back to the Postkit email theme, then Chakra Email's defaults.
 */
function resolveEmailColor(
  token: string,
  theme: EmailTheme,
  fallback: string,
): string {
  const value = resolveColor(token, theme);
  return value && value !== token ? value : fallback;
}

const baseColors = defaultTheme.colors as Record<
  string,
  Record<string, string>
>;

/** Chakra Email's default for a `gray.*` step, used when a host drops `gray`. */
function defaultGray(step: number): string {
  return baseColors['gray'][String(step)];
}

export interface PostkitEmailToneColors {
  /** The tone itself: the Callout's left border. */
  readonly tone: string;
  /** The tone's tint: the Callout's background. */
  readonly tint: string;
  /** Text on the tint. */
  readonly fg: string;
}

/** A tone's colours from the active email theme, always as literal values. */
export function usePostkitEmailToneColors(tone: Tone): PostkitEmailToneColors {
  const theme = useTheme();
  return {
    tone: resolveEmailColor(`tone.${tone}`, theme, toneColors.tone[tone]),
    tint: resolveEmailColor(`tint.${tone}`, theme, toneColors.tint[tone]),
    fg: resolveEmailColor('fg', theme, fgColor),
  };
}

/** The `gray.*` steps Postkit's neutral email views use. */
export type PostkitEmailGrayStep = 50 | 200 | 600 | 700;

/** The neutral views' greys from the active email theme, as literal values. */
export function usePostkitEmailGrays(): Record<PostkitEmailGrayStep, string> {
  const theme = useTheme();
  const gray = (step: PostkitEmailGrayStep) =>
    resolveEmailColor(`gray.${step}`, theme, defaultGray(step));
  return { 50: gray(50), 200: gray(200), 600: gray(600), 700: gray(700) };
}
