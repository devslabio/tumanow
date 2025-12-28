import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0b66c2",
          50: "#e6f0ff",
          100: "#cce1ff",
          200: "#99c3ff",
          300: "#66a5ff",
          400: "#3387ff",
          500: "#0b66c2",
          600: "#09529a",
          700: "#073d77",
          800: "#052954",
          900: "#021431",
        },
        accent: {
          DEFAULT: "#f24d12",
          50: "#fef2f0",
          100: "#fde2dc",
          200: "#fbc5b8",
          300: "#f99d88",
          400: "#f66d56",
          500: "#f24d12",
          600: "#e3390a",
          700: "#bc2d08",
          800: "#9a280d",
          900: "#7f2610",
        },
        background: {
          DEFAULT: "#f6f6f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-source-sans-pro)", "Source Sans Pro", "sans-serif"],
      },
      boxShadow: {
        'minimal': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;

