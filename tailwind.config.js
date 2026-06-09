/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Fond global
        cream:      '#FAFAF7',
        // Blobs décoratifs
        'blob-green':  '#D4E8C2',
        'blob-yellow': '#F5E6C8',
        'blob-pink':   '#F2D4D4',
        // Cartes
        chalk:      '#FFFFFF',
        // Accent CTA
        accent:     '#C8A96E',
        // Textes
        ink:        '#1A1A1A',
        dust:       '#6B6B6B',
        // Bordures / fond alternatif
        parchment:  '#F0EBE0',
        warm:       '#E8E2D8',
        // Accents couleur
        lime:       '#EEED9E',
        sage:       '#C8D8A8',
        // Statuts
        status: {
          todo:       '#F0EBE0',
          inprogress: '#FEF3C7',
          ready:      '#DCFCE7',
          done:       '#F5F4F2',
        },
        // Rétrocompat
        eerie:    '#1A1A1A',
        ghost:    '#FAFAF7',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
