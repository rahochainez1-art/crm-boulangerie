import { useEffect, useRef, useState, useCallback } from 'react'
import { subscribeOrders, isAssignedTo } from '../lib/orders'
import { getSoundEnabled } from '../lib/settings'

// ── Génère un bip 2 tons sous forme de blob WAV (aucun fichier requis) ───
// L'élément <audio> est bien plus fiable que Web Audio API sur iOS Safari
function createBeepUrl() {
  const sampleRate = 22050
  const duration   = 0.46
  const nSamples   = Math.floor(sampleRate * duration)
  const buf        = new ArrayBuffer(44 + nSamples * 2)
  const v          = new DataView(buf)

  const str = (off, s) =>
    [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)))

  // En-tête WAV
  str(0, 'RIFF'); v.setUint32(4, 36 + nSamples * 2, true)
  str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true)           // taille chunk fmt
  v.setUint16(20, 1,  true)           // PCM
  v.setUint16(22, 1,  true)           // mono
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2,  true)
  v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, nSamples * 2, true)

  // Données audio : ton 880 Hz puis ton 1 100 Hz
  for (let i = 0; i < nSamples; i++) {
    const t   = i / sampleRate
    const s1  = t < 0.18 ? Math.sin(2 * Math.PI * 880  * t) * 0.35 : 0
    const s2  = t > 0.21 ? Math.sin(2 * Math.PI * 1100 * (t - 0.21)) * 0.35 : 0
    const env = Math.min(1, t / 0.01) * Math.min(1, (duration - t) / 0.04)
    const pcm = Math.max(-1, Math.min(1, (s1 + s2) * env))
    v.setInt16(44 + i * 2, pcm * 32767, true)
  }

  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

/**
 * Détecte les nouvelles commandes après le chargement initial de la page.
 * Utilise un élément <audio> HTML pour le son (compatible iOS Safari).
 *
 * @param {string} pole  'patissiere' | 'boulangerie'
 * @returns {{ newOrders, clearNew, isUnlocked, unlock }}
 */
export function useNewOrderNotification(pole) {
  const [newOrders, setNewOrders]   = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)

  const firstSnapshotDone = useRef(false)
  const knownIds          = useRef(new Set())
  const audioRef          = useRef(null)
  const beepUrlRef        = useRef(null)
  const isUnlockedRef     = useRef(false)

  // Crée l'élément audio + blob URL une seule fois
  useEffect(() => {
    try {
      beepUrlRef.current  = createBeepUrl()
      audioRef.current    = new Audio(beepUrlRef.current)
      audioRef.current.preload = 'auto'
      audioRef.current.volume  = 1
    } catch (e) {
      console.warn('[notif] Création audio échouée :', e)
    }
    return () => {
      if (beepUrlRef.current) URL.revokeObjectURL(beepUrlRef.current)
    }
  }, [])

  // Synchronise la ref (évite les stale closures dans le callback Firestore)
  useEffect(() => { isUnlockedRef.current = isUnlocked }, [isUnlocked])

  /**
   * À appeler depuis un geste utilisateur (bouton).
   * Le play() initial dans un handler tactile débloque l'audio iOS.
   */
  const unlock = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current
        .play()
        .catch(e => console.warn('[notif] Unlock play échoué :', e))
    }
    localStorage.setItem('agj_audio_unlocked', 'true')
    setIsUnlocked(true)
    isUnlockedRef.current = true
  }, [])

  const clearNew = useCallback(() => setNewOrders([]), [])

  // Joue le son (appelé depuis le callback Firestore)
  const playSound = useCallback(() => {
    if (!audioRef.current)     return
    if (!isUnlockedRef.current) return
    if (!getSoundEnabled())    return
    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch (e) {}
  }, [])

  // Subscription Firestore indépendante
  useEffect(() => {
    const unsub = subscribeOrders((orders) => {
      const poleOrders = orders.filter(o => isAssignedTo(o, pole))

      // Premier snapshot → enregistre les IDs existants sans notifier
      if (!firstSnapshotDone.current) {
        poleOrders.forEach(o => knownIds.current.add(o.id))
        firstSnapshotDone.current = true
        return
      }

      // Snapshots suivants → détecte les nouveaux
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
