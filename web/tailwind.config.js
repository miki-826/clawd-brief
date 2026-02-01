/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans JP', 'Helvetica Neue', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji']
      },
      colors: {
        ink: {
          900: '#0b1020',
          800: '#111a33',
          700: '#182248'
        }
      }
    }
  },
  plugins: []
}
