/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef3fb',
          100: '#d5e2f5',
          200: '#adc5eb',
          300: '#7aa0dc',
          400: '#4f7ecb',
          500: '#2f60b8',
          600: '#1e4a9a',
          700: '#173a7a',
          800: '#112c5e',
          900: '#0c1f44',
        },
        ua: {
          yellow: '#F7C948',
          'yellow-dark': '#D4A800',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
