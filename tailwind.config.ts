import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        paper2: "var(--paper2)",
        paper3: "var(--paper3)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        ink3: "var(--ink3)",
        ink4: "var(--ink4)",
        line: "var(--line)",
        green: {
          DEFAULT: "var(--green)",
          soft: "var(--green-soft)",
        },
        red: {
          DEFAULT: "var(--red)",
          soft: "var(--red-soft)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          soft: "var(--amber-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "12px",
        xl: "14px",
      },
      letterSpacing: {
        tightish: "-0.015em",
      },
    },
  },
  plugins: [],
};

export default config;
