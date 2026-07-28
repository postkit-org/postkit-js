import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/astro',
  resolve: {
    alias: [
      {
        find: 'virtual:postkit/chakra-system',
        replacement: resolve(__dirname, 'src/lib/testing/default-system.ts'),
      },
      {
        find: /^.*\.astro$/,
        replacement: resolve(__dirname, 'src/lib/testing/astro-component.ts'),
      },
    ],
  },
  test: {
    name: '@postkit/astro',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.{ts,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
