const CONFIG = {
  todo:       { label: 'À faire',  cls: 'bg-status-todo text-ink/60' },
  inprogress: { label: 'En cours', cls: 'bg-status-inprogress text-amber-800' },
  ready:      { label: 'Prêt',     cls: 'bg-status-ready text-green-800' },
  done:       { label: 'Récupéré', cls: 'bg-status-done text-ink/40' },
  cancelled:  { label: 'Annulée',  cls: 'bg-red-50 text-red-500' },
}

export default function StatusBadge({ status }) {
  const c = CONFIG[status] ?? { label: status, cls: 'bg-parchment text-dust' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>
      {c.label}
    </span>
  )
}
