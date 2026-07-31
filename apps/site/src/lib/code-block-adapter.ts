import { createShikiAdapter } from '@chakra-ui/react';
import type { Highlighter } from 'shiki';

export const siteCodeBlockAdapter = createShikiAdapter<Highlighter>({
  async load() {
    const { createHighlighter } = await import('shiki');

    return createHighlighter({
      langs: ['astro', 'bash', 'json', 'markdown', 'mdx', 'tsx', 'typescript'],
      themes: ['github-dark', 'github-light'],
    });
  },
  theme: {
    dark: 'github-dark',
    light: 'github-light',
  },
});
