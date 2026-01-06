// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f4e225",
        "background-light": "#F9F6F0",
        "background-dark": "#222110",
        sand: "#E6DDD0",
        terracotta: "#8C4B3D",
        "stone-dark": "#1C1917",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(28, 25, 23, 0.05)",
        gold: "0 0 15px rgba(244, 226, 37, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
