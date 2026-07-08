import heroPatissier from '../../assets/illustrations/hero-patissier.png'

export default function HeroIllustration() {
  return (
    <img
      src={heroPatissier}
      alt=""
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}
