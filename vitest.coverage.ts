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
  reporter: ['text-summary', 'json-summary', 'lcov'],
  reportsDirectory: './test-output/vitest/coverage',
} satisfies CoverageOptions;
