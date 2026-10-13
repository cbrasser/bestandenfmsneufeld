/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // The design tokens live in src/index.css; these only name them for utilities.
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        paper: "var(--paper)",
        ground: "var(--ground)",
        hue: "var(--hue)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: "var(--font-display)",
      },
    },
  },
  plugins: [],
}
