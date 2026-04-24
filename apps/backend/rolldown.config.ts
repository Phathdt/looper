import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    inlineDynamicImports: true,
    sourcemap: true,
  },
  platform: "node",
  external: (id) => !id.startsWith(".") && !id.startsWith("/"),
});
