import path from 'node:path'

import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    pool: 'forks',
    forks: { singleFork: true },
  },
})
