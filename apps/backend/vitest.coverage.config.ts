import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Combined config — runs both unit and integration specs in one pass
// to produce a unified coverage report.
export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.entity.ts',
        'src/**/*.input.ts',
        'src/**/domain/errors.ts',
        'src/**/*.type.ts',
        'src/**/feed.types.ts',
        'src/**/index.ts',
        'src/**/interfaces/**',
        'src/**/entities/**',
        'src/test-utils/**',
        'src/common/graphql/**',
        'src/logger.config.ts',
        'src/resolvers/app.resolver.ts',
        'src/modules/prisma/prisma.service.ts',
        'src/common/throttler/gql-throttler.guard.ts',
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
})
