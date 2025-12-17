import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  publicDir: false, // We'll handle public assets manually if needed
});

