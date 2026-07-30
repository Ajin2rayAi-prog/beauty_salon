import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazir)", "Tahoma", "sans-serif"],
      },
      colors: {
        // Salon — rose/blush + deep plum palette (distinct from GymPro's fire-orange)
        rose: {
          50: "#fdf2f6",
          100: "#fce7f0",
          200: "#fbcfe1",
          300: "#f9a8c7",
          400: "#f472a8",
          500: "#ec4889",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        plum: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        coral: {
          200: "#ffd0bf",
          300: "#ffb199",
          400: "#ff9270",
          500: "#ff7a59",
          600: "#f2603c",
        },
        mint: {
          200: "#b6f2df",
          300: "#7fe6c6",
          400: "#4dd8ae",
          500: "#34d3aa",
          600: "#17b98f",
        },
        gold: {
          200: "#ffe9bd",
          300: "#ffd98f",
          400: "#ffcd6b",
          500: "#f7b73f",
        },
      },
      backgroundImage: {
        "rose-gradient": "linear-gradient(135deg, #ec4889 0%, #a855f7 100%)",
        "plum-gradient": "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
        "soft-radial": "radial-gradient(circle at 30% 20%, rgba(236,72,137,0.12), transparent 60%)",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(190,24,93,0.25)",
        card: "0 4px 24px -8px rgba(88,28,135,0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
