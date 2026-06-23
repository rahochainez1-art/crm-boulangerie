export default function AppLayout({ title, subtitle, action, children }) {
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">

      <header
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          borderBottom: '1px solid #E8DFC0',
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-xs mb-2">Au Grand Jour</p>
            <h1
              className="font-serif text-ink leading-tight"
              style={{ fontSize: '1.875rem' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1 capitalize" style={{ color: '#8A7060' }}>{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0 pb-0.5">{action}</div>}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}
