/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ledger-navy': '#1F3A5F',
        'paper': '#F7F8FA',
        'verified-green': '#2E6F40',
        'signal-saffron': '#C46210',
        'alert-rust': '#8C2F2F',
        'ink-grey': '#5A5A5A',
        'ledger-line': '#D8D3C7'
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
