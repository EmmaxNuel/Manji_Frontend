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
        // Manji brand palette
        primary: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f3d0fe',
          300: '#e9a8fd',
          400: '#da74fa',
          500: '#c044f0',  // primary brand
          600: '#a526d4',
          700: '#8b1daf',
          800: '#731a8f',
          900: '#5f1975',
          950: '#3d0650',
        },
        surface: {
          light: '#ffffff',
          dark:  '#0f0f13',
        },
        card: {
          light: '#f9f9fb',
          dark:  '#18181f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '72ch',
          },
        },
      },
    },
  },
  plugins: [],
}
