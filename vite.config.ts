import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  server: { fs: { deny: ["**/data/source/**", "**/.tools/**", "**/.git/**"] } },
});
