/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      gridTemplateRows: {
        layout: '80px 1fr 50px',
        'chat-message': '1fr',
      },
      gridTemplateColumns: {
        chat: '300px 1fr',
      },
    },
  },
  darkMode: 'class', // Change me when you decide to use the OS dark mode settings initially
  plugins: [],
}
