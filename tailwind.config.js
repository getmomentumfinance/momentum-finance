/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Change hex values in index.css :root, not here ───
        surface:  'var(--color-surface)',
        input:    'var(--color-input)',
        border:   'var(--color-border)',
        accent:   'var(--color-accent)',
        accent2:  'var(--color-accent-2)',
        muted:    'var(--color-muted)',
        'dash-bg':   'var(--color-dash-bg)',
        'dash-card': 'var(--color-dash-card)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
}
