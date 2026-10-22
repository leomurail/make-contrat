import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Affichage de remplacement ; par défaut, un écran d'erreur plein. */
  fallback?: (error: Error, retry: () => void) => ReactNode
}

/** Affiche l'erreur au lieu d'une page blanche si l'app plante (utile pour un diagnostic à distance). */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  retry = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.retry)
    return <CrashScreen error={error} />
  }
}

export function CrashScreen({ error }: { error: unknown }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <h1 style={{ fontSize: 18 }}>L'application a rencontré une erreur.</h1>
      <p>Essaie de recharger la page. Si l'erreur revient, envoie une capture de cet écran.</p>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
        {String(error)}
        {'\n\n'}
        {navigator.userAgent}
      </pre>
      <button type="button" onClick={() => location.reload()}>Recharger</button>
    </div>
  )
}
