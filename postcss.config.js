import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Resolve the Tailwind config by absolute path so it loads correctly even when
// the dev server is started from a different working directory.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: resolve(here, "tailwind.config.js") },
    autoprefixer: {},
  },
};
