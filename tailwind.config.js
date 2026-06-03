import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Absolute content globs so class scanning works regardless of the process
// working directory (the dev server may launch from elsewhere).
const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [join(here, "index.html"), join(here, "src/**/*.{ts,tsx}")],
  theme: {
    extend: {
      colors: {
        // Calm, warm light-theme palette
        cream: "#faf8f5",
        surface: "#ffffff",
        ink: "#2f2a28",
        muted: "#7a716b",
        line: "#ece6df",
        accent: {
          DEFAULT: "#7c6aa8", // calm violet — distinct from red/amber/green statuses
          soft: "#efeaf6",
          ink: "#5b4d80",
        },
        status: {
          red: "#c2603f",
          redSoft: "#fbeae3",
          amber: "#b07d28",
          amberSoft: "#fbf2dd",
          green: "#4f8a5b",
          greenSoft: "#e6f1e8",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(47,42,40,0.04), 0 4px 16px rgba(47,42,40,0.05)",
        lift: "0 8px 30px rgba(47,42,40,0.12)",
      },
      fontFamily: {
        sans: [
          "ui-rounded",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
