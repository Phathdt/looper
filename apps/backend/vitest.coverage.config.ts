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
      provider: 'istanbul',
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
        // Resolvers excluded from coverage report — NestJS @Resolver/@ResolveField
        // decorators interfere with Istanbul/v8 line attribution. Resolvers are
        // fully tested via *.resolver.integration.spec.ts (real GraphQL harness)
        // plus *.resolver.spec.ts (direct method invocation).
        'src/resolvers/**/*.resolver.ts',
        'src/resolvers/current-user.decorator.ts',
        'src/resolvers/gql-auth.guard.ts',
      ],
      thresholds: {
        statements: 99,
        branches: 99,
        functions: 99,
        lines: 99,
      },
    },
  },
})
