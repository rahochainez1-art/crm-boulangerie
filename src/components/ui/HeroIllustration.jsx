const INK = '#432F2E'
const PAPER = '#FFFCF7'

/*
  Placeholder en attendant le SVG définitif fourni par l'utilisateur.
  Pour le remplacer : coller le nouveau <svg>...</svg> à la place du
  contenu ci-dessous (le <div> halo peut rester tel quel).
*/
export default function HeroIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          inset: '8%',
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 42% 35%, #FFF6DD 0%, #FFF0B5 100%)',
        }}
      />
      <svg
        viewBox="0 0 300 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        {/* Baguette, en arrière-plan */}
        <g transform="rotate(-18 215 205)">
          <ellipse cx="215" cy="205" rx="70" ry="17" fill={PAPER} stroke={INK} strokeWidth="2.4"/>
          <path d="M164 188 L172 214" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M186 182 L194 212" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M208 180 L216 210" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
        </g>

        {/* Pied du gâteau */}
        <ellipse cx="130" cy="235" rx="58" ry="9" fill={PAPER} stroke={INK} strokeWidth="2.4"/>
        <path d="M118 220 L122 235 M142 220 L138 235" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="130" cy="220" rx="22" ry="6" fill={PAPER} stroke={INK} strokeWidth="2.2"/>

        {/* Gâteau à deux étages */}
        <path d="M96 218 L96 178 Q96 172 102 172 L158 172 Q164 172 164 178 L164 218 Z" fill={PAPER} stroke={INK} strokeWidth="2.6"/>
        <path d="M96 196 Q130 202 164 196" fill="none" stroke={INK} strokeWidth="1.8"/>
        <path d="M108 148 L108 128 Q108 123 113 123 L147 123 Q152 123 152 128 L152 148 Z" fill={PAPER} stroke={INK} strokeWidth="2.6"/>
        <path d="M108 172 L108 148 M152 172 L152 148" stroke={INK} strokeWidth="2.6" strokeLinecap="round"/>
        <path d="M108 136 Q130 141 152 136" fill="none" stroke={INK} strokeWidth="1.6"/>
        <circle cx="118" cy="128" r="3" fill={INK}/>
        <circle cx="130" cy="124" r="3" fill={INK}/>
        <circle cx="142" cy="128" r="3" fill={INK}/>

        {/* Fouet, posé contre le gâteau */}
        <path d="M176 235 L214 155" stroke={INK} strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M214 155 C206 148 206 138 214 132 C217 142 217 150 214 155Z" fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M214 155 C222 149 232 151 236 159 C226 161 218 161 214 155Z" fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M214 155 C208 163 208 173 214 179 C220 171 220 161 214 155Z" fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
