import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import BottomNav from '../../components/layout/BottomNav'

const AVATAR_KEY = 'agj_profil_avatar'
const NAME_KEY   = 'agj_profil_name'

export function useProfilAvatar() {
  return localStorage.getItem(AVATAR_KEY) || null
}

export default function Profil() {
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || null)
  const [name,   setName]   = useState(() => localStorage.getItem(NAME_KEY)   || '')
  const [saved,  setSaved]  = useState(false)
  const fileRef = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Photo trop lourde (max 3 Mo)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      localStorage.setItem(AVATAR_KEY, b64)
      setAvatar(b64)
      window.dispatchEvent(new Event('agj_avatar_updated'))
      toast.success('Photo mise à jour')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    localStorage.setItem(NAME_KEY, name.trim())
    setSaved(true)
    toast.success('Profil enregistré')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-lg mx-auto">
      <header
        className="bg-cream px-5 pb-4 border-b border-warm"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
      >
        <p className="label-xs mb-1">Au Grand Jour</p>
        <h1 className="text-2xl font-bold text-ink">Mon profil</h1>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto space-y-5">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative active:opacity-80 transition-opacity"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F8EDD4', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C8A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
            {/* Badge caméra */}
            <span
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#C8A96E', boxShadow: '0 2px 8px rgba(200,169,110,0.5)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-xs text-dust">Appuie sur la photo pour la changer</p>
        </div>

        {/* Infos */}
        <div className="bg-chalk border border-warm rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-1.5">Prénom</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Votre prénom"
              className="field"
            />
          </div>
          <div className="flex justify-between items-center pt-1">
            <div>
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-0.5">Rôle</p>
              <p className="text-sm font-semibold text-ink">Vendeur·se</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-dust uppercase tracking-widest mb-0.5">Boulangerie</p>
              <p className="text-sm font-semibold text-ink">Au Grand Jour</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:opacity-70"
          style={{
            backgroundColor: saved ? '#DCF0CC' : '#C8A96E',
            color: saved ? '#1E3D0E' : 'white',
          }}
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>

        {/* Supprimer la photo */}
        {avatar && (
          <button
            onClick={() => {
              localStorage.removeItem(AVATAR_KEY)
              setAvatar(null)
              window.dispatchEvent(new Event('agj_avatar_updated'))
              toast.success('Photo supprimée')
            }}
            className="w-full text-xs text-dust/50 py-2 active:opacity-70"
          >
            Supprimer la photo
          </button>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
