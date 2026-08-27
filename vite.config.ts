import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    /**
     * Without this the dependency optimizer inlines a second copy of react-dom
     * into the pre-bundle of any package that imports it (sonner does), which
     * gives that package its own renderer instance and makes every hook it
     * calls throw "Invalid hook call".
     */
    dedupe: ["react", "react-dom"],
  },
})