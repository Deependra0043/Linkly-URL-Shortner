/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#c8d3ff',
          300: '#a1b4ff',
          400: '#708aff',
          500: '#435eff',
          600: '#253bee',
          700: '#1d27db',
          800: '#1e22b1',
          900: '#1d218d',
          950: '#111257',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}