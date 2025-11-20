import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        foreground: "#f5f1e8",
        accent: "#d2a54e",
        muted: "#8b877d",
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "sans-serif"],
      },
      letterSpacing: {
        widecaps: "0.4em",
      },
    },
  },
  plugins: [],
};

export default config;

