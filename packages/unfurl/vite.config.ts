import { defineConfig } from 'vitest/config';
import { publicPackageCoverage } from '../../vitest.coverage';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/unfurl',
  test: {
    name: '@postkit/unfurl',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: publicPackageCoverage,
  },
});
