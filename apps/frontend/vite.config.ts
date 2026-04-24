import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: path.resolve(__dirname, "../../dist/frontend"),
    emptyOutDir: true,
  },
});
