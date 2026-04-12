import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom Retro Terminal palette
        beige: {
          retro: '#FAF8F5', // Main light background
          muted: '#F2EEE8', // Post backgrounds
        },
        brown: {
          dark: '#4A3721',   // Text & Bold lines
          medium: '#967451', // Accents
          light: '#CDBEAC',  // Subtle borders
        }
      },
    },
  },
  plugins: [],
};
export default config;