import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, editorial neutral palette with a single tasteful accent.
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#4a4a4a",
          muted: "#6b6b6b",
          faint: "#6b6b6b",
        },
        paper: {
          DEFAULT: "#faf9f7",
          card: "#ffffff",
          warm: "#f4f1ec",
        },
        accent: {
          DEFAULT: "#b45309", // warm amber
          soft: "#92400e",
          tint: "#fef3c7",
        },
        line: {
          DEFAULT: "#e5e1da",
          soft: "#efece6",
          input: "#8a847b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      maxWidth: {
        prose: "65ch",
      },
    },
  },
  plugins: [],
};

export default config;
