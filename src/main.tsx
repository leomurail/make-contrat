import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles.css'

// Demande au navigateur de ne jamais effacer la base pour libérer de l'espace.
try {
  navigator.storage?.persist?.().catch(() => {})
} catch {
  // API absente ou bloquée : sans conséquence.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
