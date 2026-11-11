import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { createPostkitAstroMdxOptions, postkitAstro } from '@postkit/astro';

// The same article as `examples/astro`, rendered with the headless
// `@postkit/react` views and their `styles.css` baseline instead of Chakra.
export default defineConfig({
  integrations: [
    postkitAstro({ renderer: 'headless', styles: true }),
    react(),
    mdx(createPostkitAstroMdxOptions()),
  ],
});
