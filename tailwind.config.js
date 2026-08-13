import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        gray: colors.stone,
        primary: {
          50: '#f3f8f4',
          100: '#e3f0e6',
          200: '#c8e0cd',
          300: '#9dc8a6',
          400: '#6ba878',
          500: '#4c8c5a',
          600: '#3f7a4a',
          700: '#33613c',
          800: '#2c4e34',
          900: '#25412c',
          950: '#112316',
        },
      },
    },
  },
  plugins: [],
}
