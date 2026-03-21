/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'marine': '#0c3a5c',
        'marine-mid': '#1e5a7a',
        'marine-dark': '#082a46',
        'body-dark': '#2d2d2d',
        'heading': '#1a1a1a',
        'bg-light': '#fafbfc',
        'border-default': '#e5e7eb',
        'grey-light': '#f3f4f6',
        'red-traffic': '#ef4444',
        'red-traffic-bg': '#fee2e2',
        'amber-traffic': '#d97706',
        'amber-traffic-bg': '#fef3c7',
        'green-traffic': '#059669',
        'green-traffic-bg': '#dbeafe',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'btn': '6px',
        'card': '12px',
      }
    },
  },
  plugins: [],
}
