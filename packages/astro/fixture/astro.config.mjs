import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { createPostkitAstroMdxOptions, postkitAstro } from '@postkit/astro';

export default defineConfig({
  integrations: [
    postkitAstro({
      chakraSystem: './src/postkit-system.ts',
    }),
    react(),
    mdx(createPostkitAstroMdxOptions()),
  ],
});
