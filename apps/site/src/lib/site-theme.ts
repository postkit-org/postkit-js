import { createSystem, defaultConfig } from '@chakra-ui/react';
import { createPostkitSystem, createPostkitTheme } from '@postkit/react';

const chakraSystem = createSystem(defaultConfig, {
  globalCss: {
    html: {
      background: 'postkitPaper',
      color: 'postkitInk',
    },
    body: {
      background: 'postkitPaper',
      color: 'postkitInk',
      fontFamily: 'body',
      textRendering: 'optimizeLegibility',
    },
  },
  theme: {
    tokens: {
      colors: {
        postkitAccent: { value: '#16845b' },
        postkitInk: { value: '#142019' },
        postkitPaper: { value: '#f4f1e8' },
      },
    },
  },
});

const postkitSiteTheme = createPostkitTheme({
  typography: {
    body: '"Avenir Next", Avenir, "Segoe UI", system-ui, -apple-system, sans-serif',
    heading: 'Iowan Old Style, "Palatino Linotype", Palatino, Georgia, serif',
    mono: '"SFMono-Regular", "Roboto Mono", Consolas, "Liberation Mono", monospace',
  },
  callout: {
    base: {
      root: {
        borderRadius: '2xl',
      },
    },
  },
  codeBlock: {
    base: {
      root: {
        borderRadius: '2xl',
      },
    },
  },
  prose: {
    base: {
      root: {
        colorPalette: 'green',
        fontSize: { base: 'md', md: 'lg' },
      },
      h2: {
        fontWeight: '500',
      },
      h3: {
        fontWeight: '600',
      },
    },
  },
});

export const siteSystem = createPostkitSystem(chakraSystem, postkitSiteTheme);
