import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tailwindScrollbar from "tailwind-scrollbar";

// https://vite.dev/config/
export default defineConfig({
  base: "/llm-intel/",
  resolve: {
    alias: {
      react: path.resolve("../node_modules/react"),
      "react-dom": path.resolve("../node_modules/react-dom"),
    },
  },
  plugins: [react(), tailwindcss(), tailwindScrollbar],
});
