import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/email',
  test: {
    name: '@postkit/email',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.{ts,tsx}'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.spec.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: [
        'text-summary',
        'json-summary',
        ['lcov', { projectRoot: '../..' }],
      ],
      reportsDirectory: './test-output/vitest/coverage',
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
