import { Inter_Tight, JetBrains_Mono } from 'next/font/google';

/**
 * Self-hosted at build time by next/font (no request to Google from the
 * reader's browser), with metric-matched fallbacks to avoid layout shift.
 * Suisse Int'l replaces Inter Tight once its files arrive (handoff 09 Q4).
 */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

/** Sets the variables that `fontStacks` in `@postkit/site-theme` reads. */
export const fontVariablesCss = `:root {
  --font-inter-tight: ${interTight.style.fontFamily};
  --font-jetbrains-mono: ${jetBrainsMono.style.fontFamily};
}`;
