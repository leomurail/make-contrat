import { usePDF } from '@react-pdf/renderer'
import { useEffect, type ReactElement } from 'react'
import { type DocumentProps } from '@react-pdf/renderer'

interface Props {
  document: ReactElement<DocumentProps>
  /** Délai avant de regénérer le PDF, pour ne pas le recalculer à chaque frappe. */
  delay?: number
}

export function PdfPreview({ document, delay = 350 }: Props) {
  const [instance, update] = usePDF({ document })

  useEffect(() => {
    const t = setTimeout(() => update(document), delay)
    return () => clearTimeout(t)
  }, [document, delay, update])

  if (instance.error) {
    return <div className="preview-state error">Erreur de rendu : {String(instance.error)}</div>
  }

  return (
    <div className="preview-frame">
      {instance.url ? <iframe title="Aperçu PDF" src={`${instance.url}#toolbar=0&view=FitH`} /> : null}
      {instance.loading ? <div className="preview-badge">Mise à jour…</div> : null}
    </div>
  )
}
