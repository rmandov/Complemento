import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  base: command === "build" ? "/work/models/PTP/NPTP/PTP_Complementario/" : "",
  server: {
    host: true,
    port: 5173,
    watch: { usePolling: false },
    hmr: { overlay: true },
  },
}));
