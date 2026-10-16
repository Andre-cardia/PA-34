import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // './' no build local; o deploy do GitHub Pages passa PA34_BASE=/PA-34/
  // (.github/workflows/pages.yml). Assets de public/ usam src/lib/asset.ts.
  base: process.env.PA34_BASE ?? './',
  // Atributos DOM injetados em meshes R3F quebram updates (code-path).
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
