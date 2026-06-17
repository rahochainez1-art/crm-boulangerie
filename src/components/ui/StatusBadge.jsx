const CONFIG = {
  todo:       { label: 'À faire',   bg: '#F1EFE8', color: 'rgba(24,24,27,0.55)' },
  inprogress: { label: 'En cours',  bg: '#FEF3C7', color: '#92400e' },
  ready:      { label: 'Prêt',      bg: '#DCFCE7', color: '#166534' },
  done:       { label: 'Récupéré',  bg: '#F4F4F5', color: 'rgba(24,24,27,0.4)' },
  cancelled:  { label: 'Annulée',   bg: '#FEE2E2', color: '#b91c1c' },
}

export default function StatusBadge({ status }) {
  const c = CONFIG[status] ?? { label: status, bg: '#F1EFE8', color: '#71717A' }
  return (
    <span
      className="inline-flex items-center text-xs font-semibold"
      style={{
        backgroundColor: c.bg,
        color: c.color,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        letterSpacing: '0.01em',
      }}
    >
      {c.label}
    </span>
  )
}
