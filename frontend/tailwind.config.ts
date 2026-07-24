import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canopy: {
          DEFAULT: "#12291C",
          light: "#1B3B29",
          dark: "#0B1C13",
        },
        laterite: {
          DEFAULT: "#BF4E2C",
          light: "#D4693F",
          dark: "#9A3D22",
        },
        marigold: {
          DEFAULT: "#E3A93F",
          light: "#EDC06B",
          dark: "#C58F2E",
        },
        ivory: "#F6F0E4",
        ink: "#221C15",
        sage: {
          DEFAULT: "#6B8570",
          light: "#8FA893",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        stamp: ["var(--font-stamp)", "monospace"],
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(18, 41, 28, 0.35)",
        lifted: "0 12px 40px -12px rgba(18, 41, 28, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
