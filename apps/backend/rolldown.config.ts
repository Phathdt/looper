import path from 'node:path'

import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/main.ts',
  output: {
    file: 'dist/main.cjs',
    format: 'cjs',
    inlineDynamicImports: true,
    sourcemap: true,
  },
  platform: 'node',
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
  external: (id) =>
    !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('@modules') && !id.startsWith('@common'),
})
