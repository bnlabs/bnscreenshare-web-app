/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
      '75vh': '75vh',
      '73vh': '73vh'
      },
      width: {
        '130vh': '130vh'
      }
    },
  },
  plugins: [],
}