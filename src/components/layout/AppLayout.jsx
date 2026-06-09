import BottomNav from './BottomNav'

export default function AppLayout({ title, subtitle, action, children }) {
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <header
        className="px-5 pb-4 border-b border-warm/60"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-xs mb-1">Au Grand Jour</p>
            <h1 className="font-serif text-2xl font-bold text-ink leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-dust mt-0.5 capitalize">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0 pb-0.5">{action}</div>}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
