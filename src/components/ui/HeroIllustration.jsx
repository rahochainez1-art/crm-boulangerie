import { useState } from 'react'
import heroPatissier from '../../assets/illustrations/hero-patissier.webp'

export default function HeroIllustration() {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      src={heroPatissier}
      alt=""
      fetchPriority="high"
      decoding="async"
      onLoad={() => setLoaded(true)}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 260ms ease',
      }}
    />
  )
}
