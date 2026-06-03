import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://dwayno44.github.io/gift-planning/ — assets must be
  // referenced from this sub-path. Use "/" for a custom domain or root host.
  base: "/gift-planning/",
  plugins: [react()],
});
