/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#1E293B',
        secondary: '#334155',
        accent:    '#2563EB',
        'app-bg':  '#F8FAFC',
        'card-bg': '#FFFFFF',
        border:    '#E2E8F0',
        'text-primary':   '#0F172A',
        'text-secondary': '#64748B',
        hover:     '#F1F5F9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
