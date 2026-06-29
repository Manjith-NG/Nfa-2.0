import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        nfa: {
          primary: "#1e3a5f",
          "primary-light": "#2d5a87",
          accent: "#0d9488",
          surface: "#f8fafc",
          border: "#e2e8f0",
          muted: "#64748b",
        },
        status: {
          approved: "#16a34a",
          pending: "#ea580c",
          rejected: "#dc2626",
          resend: "#ca8a04",
          review: "#2563eb",
          forwarded: "#7c3aed",
          completed: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
