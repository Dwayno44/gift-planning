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
        // Light theme: pure-white page, cards lifted by hairline borders + soft shadow
        cream: "#ffffff",
        surface: "#ffffff",
        ink: "#2f2a28",
        muted: "#7a716b",
        line: "#eceaf0",
        accent: {
          DEFAULT: "#2e97de", // azure blue, taken from the app icon's calendar
          soft: "#e4f1fc",
          ink: "#1b6ca8",
        },
        // Each status has a vivid shade (solid bars + dots, cheerful) and a
        // darker readable shade (chip/label text) that stays legible on white.
        status: {
          red: "#d23a22",
          redVivid: "#f2552f",
          redSoft: "#fde9e3",
          amber: "#9c5d08",
          amberVivid: "#f59e0b",
          amberSoft: "#fdf0d5",
          green: "#1f8a4c",
          greenVivid: "#34b96a",
          greenSoft: "#e2f6e9",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(47,42,40,0.05), 0 6px 18px rgba(47,42,40,0.07)",
        lift: "0 10px 34px rgba(47,42,40,0.14)",
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
