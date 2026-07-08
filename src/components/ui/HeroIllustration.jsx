import heroPatissier from '../../assets/illustrations/hero-patissier.webp'

export default function HeroIllustration() {
  return (
    <img
      src={heroPatissier}
      alt=""
      fetchPriority="high"
      decoding="async"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}
