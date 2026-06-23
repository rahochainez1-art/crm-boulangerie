/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Satoshi', 'sans-serif'],
        display: ['Clash Display', 'sans-serif'],
        serif:   ['Clash Display', 'sans-serif'], // rétrocompat — même font
      },
      colors: {
        // ── Palette Au Grand Jour ─────────────────────────────
        butter:    '#FFF0B5',    // fond principal jaune chaud
        choco:     '#432F2E',    // brun chocolat — texte principal
        sky:       '#E5F0F5',    // bleu ciel — accent secondaire
        cream:     '#FFFEF8',    // cartes blanches
        oat:       '#F0EBD0',    // inputs, surfaces secondaires
        lemon:     '#EDD83D',    // accent jaune vif — boutons CTA
        'lemon-l': '#F5ECA0',    // jaune clair — badges
        stone:     '#8A7060',    // texte secondaire (brun moyen)
        border:    '#E8DFC0',    // bordures sur fond beurre
        mint:      '#C5E6D3',    // succès vert
        // ── Sémantiques ──────────────────────────────────────
        success:   '#22C55E',
        warning:   '#F59E0B',
        error:     '#EF4444',
        info:      '#3B82F6',
        // ── Rétrocompat (anciens noms) ────────────────────────
        ink:       '#432F2E',
        dust:      '#8A7060',
        muted:     '#8A7060',
        warm:      '#E8DFC0',
        parchment: '#F0EBD0',
        chalk:     '#FFFEF8',
        surface:   '#FFFEF8',
        base:      '#FFF0B5',
        accent:    '#EDD83D',
        charcoal:  '#432F2E',
        status: {
          todo:       '#F5ECA0',
          inprogress: '#432F2E',
          ready:      '#C5E6D3',
          done:       '#EBEBEB',
        },
      },
      boxShadow: {
        card:      '0 2px 16px rgba(67,47,46,0.07)',
        'card-lg': '0 8px 40px rgba(67,47,46,0.12)',
        nav:       '0 -2px 20px rgba(67,47,46,0.08)',
        lemon:     '0 4px 20px rgba(237,216,61,0.45)',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
