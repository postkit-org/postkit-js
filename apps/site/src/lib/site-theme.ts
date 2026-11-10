import { createSystem } from '@chakra-ui/react';
import { chakraDocsThemeConfig } from '@chakra-docs/chakra/theme';
import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
} from '@postkit/chakra';
import { fontStacks, siteSystem as baseSystem } from '@postkit/site-theme';

import { siteDocsThemeConfig } from './docs-theme';

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
