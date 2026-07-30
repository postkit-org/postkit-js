import { defineConfig } from 'vitest/config';
import { publicPackageCoverage } from '../../vitest.coverage';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/next',
  test: {
    name: '@postkit/next',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.{ts,tsx}'],
    reporters: ['default'],
    coverage: publicPackageCoverage,
  },
});
