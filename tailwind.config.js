/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      gridTemplateRows: {
        'layout': '80px 1fr 50px',
      }
    },
  },
  plugins: [],
}

