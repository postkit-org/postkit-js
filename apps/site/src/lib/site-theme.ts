import { createSystem } from '@chakra-ui/react';
import { chakraDocsThemeConfig } from '@chakra-docs/chakra/theme';
import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
} from '@postkit/chakra';
import { fontStacks, siteSystem as baseSystem } from '@postkit/site-theme';

import { siteDocsThemeConfig } from './docs-theme';

/** Jumps land below the sticky header with room to spare. */
const JUMP_MARGIN = 'calc({sizes.header} + 24px)';

/**
 * Postkit's components inside the site take the site's fonts. Everything else
 * (colours, light and dark, type scale, breakpoints) comes from
 * `@postkit/site-theme`, layered over Postkit's default component theme.
 */
const postkitSiteTheme = createPostkitTheme({
  typography: {
    body: fontStacks.sans,
    heading: fontStacks.sans,
    mono: fontStacks.mono,
  },
  // Footnotes in the site's house style (CompFootnotes, SiteArticle): accent marks, notes at
  // 15px under a short faint rule. Sidenotes are styled with the article (`note-body.tsx`).
  footnote: {
    base: {
      marker: {
        color: 'accent',
        scrollMarginTop: JUMP_MARGIN,
        '& sup': { fontSize: '0.68em' },
        '&[aria-expanded=true], [data-highlighted] > &': { bg: 'tint.note' },
      },
    },
    variants: {
      variant: { subtle: { marker: { _hover: { bg: 'tint.note' } } } },
    },
  },
  footnotes: {
    base: {
      root: { color: 'fg.secondary', fontSize: '15px', lineHeight: '1.55' },
      item: {
        scrollMarginTop: JUMP_MARGIN,
        '&:target, &[data-targeted]': { bg: 'tint.note' },
        // The number keeps 4.5:1 on the tint.
        '&:target > [data-postkit-part=number], &[data-targeted] > [data-postkit-part=number]':
          { color: 'fg.secondary' },
      },
      number: { color: 'fg.muted' },
      backlink: { color: 'accent', '& a': { color: 'accent' } },
    },
    variants: {
      variant: {
        plain: { rule: { borderBlockStartColor: 'border.faint' } },
      },
    },
  },
});

/**
 * The docs pages are built on chakra-docs (PK-035). Its config only adds `chakraDocs*` slot
 * recipes; it goes first, with the site's restyling of them (`docs-theme.ts`) next, so the
 * site's own config, the Postkit preset and the Postkit theme all win wherever they meet.
 */
const docsAwareBaseSystem = createSystem(
  chakraDocsThemeConfig,
  siteDocsThemeConfig,
  baseSystem._config,
);

export const siteSystem = createPostkitSystem({
  system: docsAwareBaseSystem,
  preset: postkitDefaultTheme,
  theme: postkitSiteTheme,
});
