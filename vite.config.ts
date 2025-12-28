import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  // Base path for GitHub Pages (set to repo name if deploying to project page)
  // For user/organization pages, set to "/"
  // For project pages, set to "/repo-name/"
  base: process.env.GITHUB_PAGES_BASE || "/",
  publicDir: "public",
});

