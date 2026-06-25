const CONFIG = {
  todo:       { label: 'À faire',   bg: 'rgba(67,47,46,0.10)', color: '#432F2E',              dot: '#432F2E' },
  inprogress: { label: 'En cours',  bg: '#432F2E',             color: '#FFFFFF',              dot: 'rgba(255,255,255,0.6)' },
  ready:      { label: 'Prête',     bg: '#1D4E6B',             color: '#FFFFFF',              dot: 'rgba(255,255,255,0.7)' },
  done:       { label: 'Récupérée', bg: 'rgba(67,47,46,0.07)', color: 'rgba(67,47,46,0.45)', dot: 'rgba(67,47,46,0.25)' },
  cancelled:  { label: 'Annulée',   bg: '#FEE2E2',             color: '#991B1B',              dot: '#EF4444' },
}

export default function StatusBadge({ status }) {
  const c = CONFIG[status] ?? { label: status, bg: '#F3F4F6', color: '#8A7060', dot: '#D1D5DB' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        backgroundColor: c.bg,
        color: c.color,
        padding: '0.2rem 0.65rem',
        borderRadius: 9999,
        fontSize: '0.6875rem',
        fontWeight: 700,
        fontFamily: 'Satoshi, sans-serif',
        letterSpacing: '0.01em',
        flexShrink: 0,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: c.dot, flexShrink: 0, display: 'block' }} />
      {c.label}
    </span>
  )
}
