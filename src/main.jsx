import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem' }}>⚠️</p>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Une erreur s'est produite</p>
          <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>{String(this.state.error)}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer' }}
          >
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
