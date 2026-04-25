import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.integration.spec.ts"],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    pool: "forks",
    forks: { singleFork: true },
  },
});
