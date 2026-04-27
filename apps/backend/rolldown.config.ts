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
    tsconfigFilename: 'tsconfig.json',
  },
  external: (id) =>
    !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('@modules') && !id.startsWith('@common'),
})
