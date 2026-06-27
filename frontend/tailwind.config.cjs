/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        cream: {
          DEFAULT: '#FAF8F4',
          50: '#FDFCF9',
          100: '#FAF8F4',
          200: '#F3EFE8',
        },
        sage: {
          50: '#EEF4EC',
          100: '#DCE8D8',
          200: '#C5D9BF',
          300: '#A8C5A3',
          400: '#8BA888',
          500: '#6E9070',
          600: '#567358',
          700: '#435A45',
        },
        sand: {
          50: '#FBF6EF',
          100: '#F3E8D8',
          200: '#E8D5BC',
          300: '#D4B896',
          400: '#C4A67E',
        },
        honey: {
          50: '#FFF9E6',
          100: '#FFF3C4',
          200: '#F5E6A3',
          300: '#E8D078',
        },
        ink: {
          deep: '#2D4A4A',
          DEFAULT: '#3D5A5A',
          muted: '#5A7373',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(45, 74, 74, 0.08)',
        card: '0 2px 16px -2px rgba(45, 74, 74, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
