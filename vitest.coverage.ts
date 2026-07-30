import type { CoverageOptions } from 'vitest';

export const publicPackageCoverage = {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.spec.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.d.ts',
    'src/**/testing/**',
  ],
  reporter: [
    'text-summary',
    'json-summary',
    ['lcov', { projectRoot: '../..' }],
  ],
  reportsDirectory: './test-output/vitest/coverage',
  thresholds: {
    statements: 80,
    branches: 60,
    functions: 80,
    lines: 80,
  },
} satisfies CoverageOptions;
