import { useEffect, useRef, useState, useCallback } from 'react'
import { subscribeOrders, isAssignedTo } from '../lib/orders'
import { getSoundEnabled } from '../lib/settings'

// ── Bip 2 tons via Web Audio API (aucun fichier audio requis) ────────────
function playBeep(ctx) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    ;[
      [880,  t,        0.15],  // ton grave
      [1100, t + 0.18, 0.22],  // ton aigu
    ].forEach(([freq, start, dur]) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0,    start)
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.start(start)
      osc.stop(start + dur)
    })
  } catch (e) {
    console.warn('[notification] Audio failed:', e)
  }
}

/**
 * Détecte les nouvelles commandes arrivées après l'ouverture de la page
 * et déclenche son + alerte visuelle.
 *
 * @param {string} pole  - 'patissiere' | 'boulangerie'
 * @returns {{ newOrders, clearNew, isUnlocked, unlock }}
 */
export function useNewOrderNotification(pole) {
  const [newOrders, setNewOrders]   = useState([])
  // isUnlocked = AudioContext créé dans cette session (geste utilisateur requis)
  const [isUnlocked, setIsUnlocked] = useState(false)

  const firstSnapshotDone = useRef(false)  // premier snapshot Firestore reçu ?
  const knownIds          = useRef(new Set())
  const audioCtxRef       = useRef(null)
  const isUnlockedRef     = useRef(false)  // ref pour closure sans stale value

  // Synchronise la ref avec le state
  useEffect(() => { isUnlockedRef.current = isUnlocked }, [isUnlocked])

  // ── Crée l'AudioContext sur geste utilisateur + joue un bip de test ────
  const unlock = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (Ctx) {
        if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
        playBeep(audioCtxRef.current)
      }
    } catch (e) {
      console.warn('[notification] AudioContext unavailable:', e)
    }
    localStorage.setItem('agj_audio_unlocked', 'true')
    setIsUnlocked(true)
    isUnlockedRef.current = true
  }, [])

  // ── Efface les nouvelles commandes (appel depuis le composant) ─────────
  const clearNew = useCallback(() => setNewOrders([]), [])

  // ── Subscription Firestore indépendante ────────────────────────────────
  useEffect(() => {
    const unsub = subscribeOrders((orders) => {
      const poleOrders = orders.filter(o => isAssignedTo(o, pole))

      // Premier snapshot : enregistre les IDs existants, pas de notification
      if (!firstSnapshotDone.current) {
        poleOrders.forEach(o => knownIds.current.add(o.id))
        firstSnapshotDone.current = true
        return
      }

      // Snapshots suivants : détecte les nouveaux IDs
      const fresh = poleOrders.filter(o => !knownIds.current.has(o.id))
      if (fresh.length === 0) return

      fresh.forEach(o => knownIds.current.add(o.id))

      // Son si l'utilisateur l'a autorisé
      if (getSoundEnabled() && isUnlockedRef.current) {
        playBeep(audioCtxRef.current)
      }

      setNewOrders(prev => [...prev, ...fresh])
    })

    return unsub  // nettoyage au démontage
  }, [pole])

  return { newOrders, clearNew, isUnlocked, unlock }
}
