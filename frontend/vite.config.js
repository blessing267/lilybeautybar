import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "/static/",

  build: {
    outDir: "dist",
    assetsDir: "assets",

    rollupOptions: {
      output: {
        entryFileNames: "assets/dashboard.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: ({ name }) => {
          if (name?.endsWith(".css")) {
            return "assets/dashboard.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
});