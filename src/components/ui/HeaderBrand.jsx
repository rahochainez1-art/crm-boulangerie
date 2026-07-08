function IconCroissant() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#432F2E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15c1-6 6-10 12-10 4 0 6 2 6 4 0 3-3 4-5 3-3-1-5 1-6 4-1 2-3 3-5 2-2-1-2-2-2-3z"/>
      <path d="M8 11c1 1 1 3 0 4"/>
      <path d="M12 8.5c1 1 1 3 0 4.5"/>
      <path d="M16 7.5c1 1 1 2.5 .5 4"/>
    </svg>
  )
}

export default function HeaderBrand({ right }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
        <div
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF0B5', flexShrink: 0 }}
        >
          <IconCroissant />
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="font-editorial" style={{ fontSize: '1.375rem', fontWeight: 600, color: '#211817', lineHeight: 1.15 }}>
            Au Grand Jour
          </p>
          <p style={{ fontSize: '0.625rem', color: '#6D6258', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'Satoshi' }}>
            BOULANGERIE · PÂTISSERIE
          </p>
        </div>
      </div>
      {right && <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}
