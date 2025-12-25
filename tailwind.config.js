/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'christmas-red': '#722F37',
        'christmas-green': '#228B22',
        'christmas-gold': '#D4AF37',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'great-vibes': ['Great Vibes', 'cursive'],
      },
      animation: {
        'breathe': 'breathe 2s ease-in-out infinite',
        'rotate': 'rotate 4s linear infinite',
        'marquee': 'marquee 10s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        rotate: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}