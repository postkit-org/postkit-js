import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
} from '@postkit/chakra';
import { fontStacks, siteSystem as baseSystem } from '@postkit/site-theme';

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

export const siteSystem = createPostkitSystem({
  system: baseSystem,
  preset: postkitDefaultTheme,
  theme: postkitSiteTheme,
});
