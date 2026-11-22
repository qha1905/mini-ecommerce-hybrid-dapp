/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rarible: {
          yellow: "#e2f500",
          yellowHover: "#ecff1a",
          dark: "#050608",
          card: "#0d0e14",
          cardHover: "#161822",
          border: "#1f222d",
          borderHover: "#333748",
          textMuted: "#8e92a4"
        },
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        eth: {
          DEFAULT: "#627EEA",
          dark: "#3B4D8A",
        }
      }
    },
  },
  plugins: [],
}
