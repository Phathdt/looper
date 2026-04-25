import path from 'node:path'

import react from '@vitejs/plugin-react'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.ts', 'src/components/ui/**/*.tsx', 'src/features/**/*.tsx', 'src/features/**/hooks/*.ts'],
      exclude: [
        'src/generated/**',
        'src/main.tsx',
        'src/app.tsx',
        'src/router.tsx',
        'src/vite-env.d.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 85,
        lines: 90,
      },
    },
  },
})
