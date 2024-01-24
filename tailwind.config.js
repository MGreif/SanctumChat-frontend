/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      gridTemplateRows: {
        'layout': '80px 1fr 50px',
        'chat-message': '1fr 100px',
      },
      gridTemplateColumns: {
        'chat': '300px 1fr',
      }
    },
  },
  plugins: [],
}

