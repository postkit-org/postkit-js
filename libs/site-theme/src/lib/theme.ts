// postkit.org Chakra v3 system (from docs/design/handoff/tokens/ts/theme.ts).
// Hand-written from ../tokens.json; theme.spec.ts fails if the colours drift apart.
//
// Fonts: the app loads Inter Tight and JetBrains Mono with next/font and exposes them as
// --font-inter-tight and --font-jetbrains-mono. Each var() has the family name as its
// fallback, so the stacks still work where those variables aren't set (emails, tests).
import {
  createSystem,
  defaultBaseConfig,
  defineConfig,
} from '@chakra-ui/react';

import { chakraThemeConfig } from './chakra-theme';
import { siteRecipes, siteSlotRecipes } from './recipes';

// Chakra's own semantic tokens use `_light` / `_dark`. Overriding them with `base`
// alone leaves Chakra's `_light` value in place, so set both conditions explicitly.
const mode = (light: string, dark: string) => ({
  value: { _light: light, _dark: dark },
});

export const fontStacks = {
  sans: "'Suisse Int\\'l', var(--font-inter-tight, 'Inter Tight'), system-ui, sans-serif",
  mono: "var(--font-jetbrains-mono, 'JetBrains Mono'), ui-monospace, SFMono-Regular, monospace",
} as const;

export const gradients = {
  brand:
    'linear-gradient(90deg, #D4B8FF 0%, #F4A3BE 32%, #FF8B57 64%, #F3C460 100%)',
  brandVertical:
    'linear-gradient(180deg, #D4B8FF 0%, #F4A3BE 32%, #FF8B57 64%, #F3C460 100%)',
  logo: 'linear-gradient(100deg, #D4B8FF 0%, #F4A3BE 32%, #FF8B57 64%, #F3C460 100%)',
  cover:
    'linear-gradient(180deg, #D8C1FF 0%, #F3A7C6 34%, #FF9B66 66%, #F5CF73 100%)',
} as const;

export const siteConfig = defineConfig({
  globalCss: {
    'html, body': {
      bg: 'bg',
      color: 'fg',
      fontFamily: 'body',
      fontSize: 'body',
      lineHeight: 'body',
    },
    '::selection': { bg: 'highlight', color: 'fg' },
    a: { color: 'inherit' },
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'accent',
      outlineOffset: '2px',
    },
    '*, *::before, *::after': {
      '@media (prefers-reduced-motion: reduce)': {
        transitionDuration: '0.01ms !important',
        animationDuration: '0.01ms !important',
      },
    },
  },
  theme: {
    // Min-width breakpoints. md = desktop from 761px (the boards' phone rule is max-width 760px);
    // xl = sidenotes. The Commune band (767px) and Made with OSS rows (1100px) use their own media queries.
    breakpoints: {
      sm: '480px',
      md: '761px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },
    // Site primitives (PK-014). Named `site*` so Chakra's built-in recipes, which Postkit's
    // components render with, keep their look inside the site.
    recipes: siteRecipes,
    slotRecipes: siteSlotRecipes,
    tokens: {
      fonts: {
        body: { value: fontStacks.sans },
        heading: { value: fontStacks.sans },
        mono: { value: fontStacks.mono },
      },
      fontWeights: {
        regular: { value: 400 },
        medium: { value: 500 },
        semibold: { value: 600 },
      },
      fontSizes: {
        '2xs': { value: '11px' },
        xs: { value: '12px' },
        sm: { value: '13px' },
        md: { value: '15px' },
        body: { value: '17px' },
        lg: { value: '19px' },
        xl: { value: '24px' },
        '2xl': { value: '28px' },
        '3xl': { value: '34px' },
        '4xl': { value: '44px' },
        '5xl': { value: '64px' },
      },
      lineHeights: {
        tight: { value: 1.04 },
        heading: { value: 1.15 },
        snug: { value: 1.4 },
        body: { value: 1.5 },
        prose: { value: 1.65 },
      },
      letterSpacings: {
        display: { value: '-0.03em' },
        heading: { value: '-0.02em' },
        tight: { value: '-0.01em' },
      },
      spacing: {
        gutter: { value: '24px' },
        section: { value: '96px' },
        sectionPhone: { value: '64px' },
      },
      radii: {
        xs: { value: '4px' },
        sm: { value: '8px' },
        md: { value: '12px' },
        lg: { value: '14px' },
        xl: { value: '16px' },
        '2xl': { value: '20px' },
        '3xl': { value: '28px' },
        full: { value: '999px' },
      },
      sizes: {
        // One width for every page, the header and the footer (decided Nov 10, 2026), so the
        // chrome doesn't shift between docs and the rest of the site. `docs` matches it.
        content: { value: '1280px' },
        docs: { value: '1280px' },
        prose: { value: '680px' },
        docsMain: { value: '720px' },
        sidenote: { value: '192px' },
        sidenoteGap: { value: '28px' },
        header: { value: '56px' },
        tap: { value: '44px' },
      },
      durations: {
        hover: { value: '120ms' },
        anatomy: { value: '550ms' },
        copyRevert: { value: '1600ms' },
      },
      easings: { anatomy: { value: 'cubic-bezier(.2,.7,.2,1)' } },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: mode('#FFFFFF', '#0F0F11'),
          subtle: mode('#F5F5F4', '#1C1C1E'),
          hover: mode('#EBEBE9', '#262628'),
          pressed: mode('#E2E2DF', '#303033'),
          raised: mode('#FFFFFF', '#3A3A3C'),
          kbd: mode('#FFFFFF', '#0F0F11'),
          inverted: mode('#1D1D1F', '#F5F5F7'),
          invertedHover: mode('#3A3A3C', '#D1D1D6'),
          invertedPressed: mode('#000000', '#FFFFFF'),
          code: mode('#1D1D1F', '#161618'),
          glass: mode('rgba(255,255,255,0.62)', 'rgba(15,15,17,0.66)'),
          scrim: mode('rgba(29,29,31,0.30)', 'rgba(0,0,0,0.60)'),
          commune: mode('#000000', '#000000'),
        },
        fg: {
          DEFAULT: mode('#1D1D1F', '#F5F5F7'),
          secondary: mode('#3A3A3C', '#D1D1D6'),
          muted: mode('#6E6E73', '#A1A1A6'),
          quiet: mode('#86868B', '#8E8E93'),
          inverted: mode('#FFFFFF', '#0F0F11'),
          onCode: mode('#F5F5F7', '#F5F5F7'),
          commune: mode('#FFFFFF', '#FFFFFF'),
        },
        border: {
          DEFAULT: mode('#ECECEA', '#2A2A2D'),
          strong: mode('#1D1D1F', '#F5F5F7'),
          faint: mode('#C9C9C6', '#48484A'),
          hover: mode('#D2D2D0', '#3A3A3C'),
          header: mode('rgba(29,29,31,0.08)', 'rgba(255,255,255,0.10)'),
        },
        accent: mode('#2F5BE3', '#728FEC'),
        highlight: mode('#FDDCCB', 'rgba(255,139,87,0.34)'),
        tone: {
          note: mode('#2F5BE3', '#728FEC'),
          tip: mode('#23794A', '#69A484'),
          important: mode('#6E44D6', '#9C80E3'),
          warning: mode('#A15C00', '#BF9052'),
          caution: mode('#B42E24', '#CC716A'),
        },
        tint: {
          note: mode('#E6EBFC', '#161F40'),
          tip: mode('#E5EFE9', '#14261D'),
          important: mode('#EEE9FA', '#251B3C'),
          warning: mode('#F4EBE0', '#301F0D'),
          caution: mode('#F6E6E5', '#331616'),
        },
      },
      shadows: {
        dialog: mode(
          '0 0 0 1px rgba(29,29,31,0.06), 0 24px 72px rgba(29,29,31,0.22)',
          '0 0 0 1px rgba(255,255,255,0.08), 0 24px 72px rgba(0,0,0,0.6)',
        ),
        segment: mode(
          '0 1px 2px rgba(0,0,0,0.08)',
          '0 1px 2px rgba(0,0,0,0.4)',
        ),
        kbd: mode(
          'inset 0 0 0 1px rgba(29,29,31,0.10)',
          'inset 0 0 0 1px rgba(255,255,255,0.14)',
        ),
      },
    },
    textStyles: {
      hero: {
        value: {
          fontSize: 'clamp(44px, 6.4vw, 88px)',
          fontWeight: 500,
          lineHeight: 1.04,
          letterSpacing: '-0.03em',
        },
      },
      pageTitle: {
        value: {
          fontSize: 'clamp(40px, 5.6vw, 76px)',
          fontWeight: 500,
          lineHeight: 1.04,
          letterSpacing: '-0.03em',
        },
      },
      section: {
        value: {
          fontSize: 'clamp(34px, 4.4vw, 56px)',
          fontWeight: 500,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
        },
      },
      docsH2: {
        value: {
          fontSize: '28px',
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        },
      },
      body: { value: { fontSize: '17px', lineHeight: 1.5 } },
      prose: {
        value: { fontSize: { base: '17px', md: '19px' }, lineHeight: 1.65 },
      },
      label: { value: { fontSize: '13px', color: 'fg.muted' } },
      mono: { value: { fontFamily: 'mono', fontSize: '13px' } },
    },
  },
});

/**
 * Chakra's default config minus the built-in recipes nothing on the site renders
 * (`chakra-theme.ts`), then the site's. Built on `defaultConfig`, every page would ship all
 * of Chakra's recipes.
 */
export const siteSystem = createSystem(
  defaultBaseConfig,
  chakraThemeConfig,
  siteConfig,
);
