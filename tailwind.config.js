/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand green (main CTA, active states, confirmations)
        primary: {
          50: "#EAF8EF",  // Soft green surface
          100: "#D3F1DF",
          200: "#A7E3BF",
          300: "#7BD59F",
          400: "#4FC780",
          500: "#1FA75B", // Action green
          600: "#168A4A", // Primary green / CTA
          700: "#12703C",
          800: "#0E572E",
          900: "#0A3D20",
          950: "#052412",
        },
        // Refined Navy palette
        navy: {
          950: "#071629", // Deep navy
          900: "#0B1F3A", // Primary navy
          800: "#122033", // Main text
          700: "#1E2E44",
          600: "#33455E",
          500: "#475B77",
          400: "#64748B", // Muted text
        },
        // Supporting Blue
        brandBlue: {
          50: "#EAF2FF",  // Soft blue surface
          500: "#2563EB", // Supporting blue
          600: "#1D4ED8",
        },
        // Action & Soft surfaces
        surface: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          green: "#EAF8EF",
          blue: "#EAF2FF",
        },
        accent: {
          50: "#EAF8EF",
          100: "#D3F1DF",
          500: "#1FA75B",
          600: "#168A4A",
          700: "#12703C",
        },
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(11, 31, 58, 0.04)",
        card: "0 2px 4px -1px rgba(11, 31, 58, 0.04), 0 4px 6px -2px rgba(11, 31, 58, 0.02)",
        elevated: "0 10px 25px -5px rgba(11, 31, 58, 0.08), 0 8px 10px -6px rgba(11, 31, 58, 0.04)",
        modal: "0 20px 25px -5px rgba(7, 22, 41, 0.15), 0 8px 10px -6px rgba(7, 22, 41, 0.1)",
      },
    },
  },
  plugins: [],
};
