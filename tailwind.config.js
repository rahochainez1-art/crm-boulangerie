/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
      colors: {
        // ── Fond & surfaces ──────────────────────────────────
        base:         '#F8F7F3',
        surface:      '#FFFFFF',
        'surface-2':  '#F1EFE8',
        // ── Textes ──────────────────────────────────────────
        ink:          '#18181B',
        muted:        '#71717A',
        dust:         '#71717A',
        // ── Bordures ────────────────────────────────────────
        border:       '#E7E5E4',
        warm:         '#E7E5E4',
        // ── Accent principal ────────────────────────────────
        accent:       '#E8E27A',
        'accent-h':   '#DDD660',
        'accent-l':   '#F7F4C8',
        // ── Sémantiques ─────────────────────────────────────
        success:      '#22C55E',
        info:         '#3B82F6',
        warning:      '#F59E0B',
        error:        '#EF4444',
        // ── Rétrocompat ─────────────────────────────────────
        chalk:        '#FFFFFF',
        cream:        '#F8F7F3',
        parchment:    '#F1EFE8',
        lime:         '#F7F4C8',
        sage:         '#D1FAE5',
        // ── Statuts ─────────────────────────────────────────
        status: {
          todo:       '#F1EFE8',
          inprogress: '#FEF3C7',
          ready:      '#DCFCE7',
          done:       '#F4F4F5',
        },
      },
      boxShadow: {
        card:      '0 4px 24px rgba(0,0,0,0.04)',
        'card-md': '0 8px 40px rgba(0,0,0,0.07)',
        nav:       '0 -4px 24px rgba(0,0,0,0.04)',
        accent:    '0 8px 32px rgba(232,226,122,0.35)',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
