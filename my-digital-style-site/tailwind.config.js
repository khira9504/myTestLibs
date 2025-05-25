/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1E50B5" },
        black:   { DEFAULT: "#262020" },
        red:     { DEFAULT: "#E60032" }
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "sans-serif"],
        mono: ["'Noto Sans Mono'", "monospace"]
      }
    }
  },
  plugins: []
};
