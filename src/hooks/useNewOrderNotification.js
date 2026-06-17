import { useEffect, useRef, useState, useCallback } from 'react'
import { subscribeOrders, isAssignedTo } from '../lib/orders'
import { getSoundEnabled } from '../lib/settings'

// ── Génère un bip 2 tons en data URI WAV (pas de blob URL, compatible CSP iOS) ──
function buildBeepDataUri() {
  const sampleRate = 22050
  const duration   = 0.46
  const nSamples   = Math.floor(sampleRate * duration)
  const buf        = new ArrayBuffer(44 + nSamples * 2)
  const v          = new DataView(buf)

  const str = (off, s) =>
    [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)))

  str(0, 'RIFF'); v.setUint32(4, 36 + nSamples * 2, true)
  str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, nSamples * 2, true)

  for (let i = 0; i < nSamples; i++) {
    const t   = i / sampleRate
    const s1  = t < 0.18 ? Math.sin(2 * Math.PI * 880  * t) * 0.38 : 0
    const s2  = t > 0.21 ? Math.sin(2 * Math.PI * 1100 * (t - 0.21)) * 0.38 : 0
    const env = Math.min(1, t / 0.01) * Math.min(1, (duration - t) / 0.04)
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, (s1 + s2) * env)) * 32767, true)
  }

  // Convertit en data URI base64 (aucune dépendance URL.createObjectURL)
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return `data:audio/wav;base64,${btoa(bin)}`
}

// Data URI calculée une seule fois au chargement du module
const BEEP_DATA_URI = buildBeepDataUri()

/**
 * Détecte les nouvelles commandes après le premier snapshot Firestore.
 * Son via élément <audio> natif dans le DOM — méthode la plus fiable sur iOS Safari.
 *
 * Usage : appeler unlock() DEPUIS un handler onTouchStart ou onClick sur un bouton.
 */
export function useNewOrderNotification(pole) {
  const [newOrders, setNewOrders]   = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)

  const firstSnapshotDone = useRef(false)
  const knownIds          = useRef(new Set())
  const audioRef          = useRef(null)
  const isUnlockedRef     = useRef(false)

  // Crée un vrai élément <audio> dans le DOM (plus fiable que new Audio() sur iOS)
  useEffect(() => {
    const el = document.createElement('audio')
    el.src        = BEEP_DATA_URI
    el.setAttribute('playsinline', '')   // empêche le fullscreen sur iOS
    el.preload    = 'auto'
    el.volume     = 1
    el.style.display = 'none'
    document.body.appendChild(el)
    audioRef.current = el
    return () => {
      el.pause()
      document.body.removeChild(el)
    }
  }, [])

  useEffect(() => { isUnlockedRef.current = isUnlocked }, [isUnlocked])

  /**
   * À appeler DIRECTEMENT depuis onTouchStart ou onClick d'un bouton.
   * iOS n'autorise audio.play() que dans le call-stack synchrone d'un geste.
   */
  const unlock = useCallback(() => {
    const el = audioRef.current
    if (!el) return

    el.currentTime = 0
    el.play()
      .then(() => {
        // Play réussi → on marque comme débloqué
        localStorage.setItem('agj_audio_unlocked', 'true')
        setIsUnlocked(true)
        isUnlockedRef.current = true
      })
      .catch(err => {
        console.warn('[notif] audio.play() refusé par iOS :', err.message)
        // Ne pas setIsUnlocked — le bouton reste visible pour relancer
      })
  }, [])

  const clearNew = useCallback(() => setNewOrders([]), [])

  const playSound = useCallback(() => {
    const el = audioRef.current
    if (!el || !isUnlockedRef.current || !getSoundEnabled()) return
    el.currentTime = 0
    el.play().catch(() => {})
  }, [])

  // Subscription Firestore
  useEffect(() => {
    const unsub = subscribeOrders((orders) => {
      const poleOrders = orders.filter(o => isAssignedTo(o, pole))

      if (!firstSnapshotDone.current) {
        poleOrders.forEach(o => knownIds.current.add(o.id))
        firstSnapshotDone.current = true
        return
      }

      const fresh = poleOrders.filter(o => !knownIds.current.has(o.id))
      if (fresh.length === 0) return

      fresh.forEach(o => knownIds.current.add(o.id))
      playSound()
      setNewOrders(prev => [...prev, ...fresh])
    })

    return unsub
  }, [pole, playSound])

  return { newOrders, clearNew, isUnlocked, unlock }
}
