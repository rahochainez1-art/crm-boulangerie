import heroPatissier from '../../assets/illustrations/hero-patissier.svg'

export default function HeroIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 42% 35%, #FFF6DD 0%, #FFF0B5 100%)',
          zIndex: 0,
        }}
      />
      <img
        src={heroPatissier}
        alt=""
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
      />
    </div>
  )
}
