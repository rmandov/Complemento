import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // HMR manual - trabajo desde WSL
  server: {
    host: true,
    port: 5173,

    watch: {
      usePolling: false,
    },

    hmr: {
      overlay: true,
    },
  },
});
