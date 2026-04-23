import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.spec.ts", "test/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/modules/**/*.ts"],
      exclude: [
        "src/**/*.module.ts",
        "src/**/*.model.ts",
        "src/**/*.models.ts",
        "src/**/dto/**",
        "src/**/*.resolver.ts",
        "src/main.ts",
        "src/app.module.ts",
        "src/app.resolver.ts",
        "src/logger.config.ts",
        "src/modules/graphql/**",
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 85,
        lines: 90,
      },
    },
  },
});
