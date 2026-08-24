/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        veeva: {
          orange: '#FF5F00',
          navy: '#0B192C',
          charcoal: '#2D2D2D',
        },
      },
      fontFamily: {
        racing: ['Impact', 'Arial Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
