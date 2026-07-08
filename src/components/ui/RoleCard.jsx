import { ArrowRight } from 'lucide-react'

export default function RoleCard({ title, description, icon: Icon, iconBg, iconColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left transition-transform active:scale-[0.98]"
      style={{
        backgroundColor: '#FFFCF7',
        border: '1px solid rgba(67,47,46,0.12)',
        borderRadius: 22,
        padding: 18,
        gap: 16,
        boxShadow: '0 6px 18px rgba(67,47,46,0.06)',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: iconBg, color: iconColor, flexShrink: 0 }}
      >
        <Icon size={28} strokeWidth={1.6} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-editorial" style={{ fontSize: '1.375rem', fontWeight: 600, color: '#211817', lineHeight: 1.15, marginBottom: 4 }}>
          {title}
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6D6258', fontFamily: 'Satoshi', lineHeight: 1.4 }}>
          {description}
        </p>
      </div>

      <div
        className="flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 9999,
          flexShrink: 0,
          backgroundColor: '#432F2E',
        }}
      >
        <ArrowRight size={18} strokeWidth={2.2} color="#FFFCF7" />
      </div>
    </button>
  )
}
