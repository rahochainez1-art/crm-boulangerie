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
        // ── Huru palette ─────────────────────────────────────
        butter:    '#F5EEB5',    // fond principal chaud
        lemon:     '#EBDF28',    // accent vif
        'lemon-l': '#F5F0A8',    // accent léger
        oat:       '#E8E4C4',    // inputs, surfaces secondaires
        cream:     '#FEFDF5',    // cartes
        charcoal:  '#232726',    // texte principal
        stone:     '#6E6B4E',    // texte secondaire
        border:    '#DDD9B0',    // bordures sur fond beurre
        mint:      '#C5E6D3',    // succès
        // ── Sémantiques ──────────────────────────────────────
        success:   '#22C55E',
        warning:   '#F59E0B',
        error:     '#EF4444',
        info:      '#3B82F6',
        // ── Rétrocompat ──────────────────────────────────────
        ink:       '#232726',
        dust:      '#6E6B4E',
        muted:     '#6E6B4E',
        warm:      '#DDD9B0',
        parchment: '#E8E4C4',
        chalk:     '#FEFDF5',
        surface:   '#FEFDF5',
        base:      '#F5EEB5',
        accent:    '#EBDF28',
        status: {
          todo:       '#E8E4C4',
          inprogress: '#FEF3C7',
          ready:      '#C5E6D3',
          done:       '#EDEDEA',
        },
      },
      boxShadow: {
        card:    '0 2px 16px rgba(35,39,38,0.06)',
        'card-lg': '0 8px 40px rgba(35,39,38,0.10)',
        nav:     '0 -2px 16px rgba(35,39,38,0.06)',
        lemon:   '0 4px 20px rgba(235,223,40,0.5)',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
