/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Clash Display"', '-apple-system', 'sans-serif'],
        serif:   ['"Clash Display"', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Palette Au Grand Jour 2026 ────────────────────────
        butter:    '#FFF0B5',    // jaune beurre — accents, sélection
        choco:     '#432F2E',    // brun chocolat — texte, CTA
        sky:       '#E5F0F5',    // bleu grisé — surfaces info
        cream:     '#F5F2EB',    // crème — fond de page
        oat:       '#F0EBD0',    // avoine — surfaces secondaires
        lemon:     '#EDD83D',    // jaune vif — indicateurs, FAB accent
        'lemon-l': '#FEFCE8',   // jaune très clair
        stone:     '#8A7060',    // pierre — texte muted
        noir:      '#111111',    // noir texte — headings
        // ── Surfaces ──────────────────────────────────────────
        surface:   '#FFFFFF',    // cartes
        chalk:     '#FFFFFF',    // cartes (rétrocompat)
        parchment: 'rgba(67,47,46,0.05)',
        // ── Bordures ──────────────────────────────────────────
        border:    'rgba(67,47,46,0.08)',
        warm:      'rgba(67,47,46,0.08)',  // rétrocompat
        // ── Sémantiques ───────────────────────────────────────
        success:   '#22C55E',
        warning:   '#F59E0B',
        error:     '#EF4444',
        info:      '#3B82F6',
        mint:      '#D1FAE5',
        // ── Rétrocompat ───────────────────────────────────────
        ink:       '#432F2E',
        dust:      '#8A7060',
        muted:     '#8A7060',
        base:      '#F5F2EB',
        accent:    '#EDD83D',
        charcoal:  '#432F2E',
        status: {
          todo:       '#FEFCE8',
          inprogress: '#432F2E',
          ready:      '#D1FAE5',
          done:       '#F3F4F6',
        },
      },
      boxShadow: {
        card:      '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(67,47,46,0.06)',
        'card-lg': '0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(67,47,46,0.10)',
        nav:       '0 -1px 0 rgba(67,47,46,0.06), 0 -8px 24px rgba(67,47,46,0.08)',
        fab:       '0 8px 24px rgba(67,47,46,0.30)',
        lemon:     '0 4px 20px rgba(237,216,61,0.35)',
      },
      borderRadius: {
        pill: '9999px',
        card: '20px',
      },
    },
  },
  plugins: [],
}
