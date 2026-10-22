import { pdf } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { DocForm } from './components/DocForm'
import { ErrorBoundary } from './components/ErrorBoundary'
import { History } from './components/History'
import { PdfPreview } from './components/PdfPreview'
import { formatNumber, issueDocument, lastNumber, parseSeq, resolveData, yearOf } from './lib/archive'
import { db, type StoredDocument } from './lib/db'
import { saveBlob } from './lib/download'
import { clearData, loadData, saveData } from './lib/storage'
import type { DocData, DocTemplate } from './lib/types'
import { templates } from './templates'

type View = 'editor' | 'history'

async function renderPdf(template: DocTemplate, data: DocData): Promise<void> {
  const Doc = template.Document
  saveBlob(await pdf(<Doc data={data} />).toBlob(), template.fileName(data))
}

export default function App() {
  const [view, setView] = useState<View>('editor')
  const [templateId, setTemplateId] = useState(templates[0].id)
  const template = templates.find((t) => t.id === templateId) ?? templates[0]

  const [data, setData] = useState<DocData>(() => loadData(template.id, template.defaults()))
  const [issuing, setIssuing] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => saveData(template.id, data), [template.id, data])

  const { field: numberField, dateField } = template.numbering
  const year = yearOf(data[dateField])
  const last = useLiveQuery(() => lastNumber(template.id, year).catch(() => 0), [template.id, year])
  // On saisit juste le numéro (1) ; l'année de la date d'émission est ajoutée (2026-001).
  const seq = parseSeq(data[numberField])
  const numero = seq === null ? '' : formatNumber(year, seq)
  const docCount = useLiveQuery(() => db.documents.count().catch(() => 0), [])
  const knownLabels = useLiveQuery(() => db.documents.orderBy('label').uniqueKeys().catch(() => []), [])

  const previewData = useMemo(() => ({ ...data, [numberField]: numero || '…' }), [data, numberField, numero])
  // Repère affiché sous le champ Numéro : le numéro n'est plus attribué automatiquement.
  const groups = useMemo(() => template.groups.map((g) => ({
    ...g,
    fields: g.fields.map((f) => f.key === numberField && f.type === 'number'
      ? {
          ...f,
          placeholder: String((last ?? 0) + 1),
          hint: last
            ? `Dernier numéro émis en ${year} : ${formatNumber(year, last)}`
            : `Aucun contrat émis en ${year} : commence à 1 (${formatNumber(year, 1)})`,
        }
      : f),
  })), [template.groups, numberField, last, year])
  const Doc = template.Document
  const document = useMemo(() => <Doc data={previewData} />, [Doc, previewData])

  const selectTemplate = (id: string) => {
    const next = templates.find((t) => t.id === id)!
    setTemplateId(id)
    setData(loadData(next.id, next.defaults()))
    setNotice(null)
  }

  const reset = () => {
    clearData(template.id)
    setData(template.defaults())
    setNotice(null)
  }

  const issue = async () => {
    setIssuing(true)
    setNotice(null)
    try {
      const doc = await issueDocument(template, data)
      setData((d) => ({ ...d, [numberField]: '' }))
      await renderPdf(template, await resolveData(doc.data))
      setNotice({ text: `${template.name} ${doc.numero} émis et enregistré dans l'historique.` })
    } catch (e) {
      setNotice({ text: `Émission impossible : ${(e as Error).message}`, error: true })
    } finally {
      setIssuing(false)
    }
  }

  const downloadStored = async (doc: StoredDocument) => {
    const t = templates.find((t) => t.id === doc.templateId)
    if (!t) throw new Error(`Modèle « ${doc.templateId} » introuvable.`)
    await renderPdf(t, await resolveData(doc.data))
  }

  const duplicate = async (doc: StoredDocument) => {
    const t = templates.find((t) => t.id === doc.templateId)
    if (!t) throw new Error(`Modèle « ${doc.templateId} » introuvable.`)
    const copy = await resolveData(doc.data)
    setTemplateId(t.id)
    setData({ ...t.defaults(), ...copy, [t.numbering.field]: '', [t.numbering.dateField]: t.defaults()[t.numbering.dateField] })
    setNotice({ text: `Copie de ${doc.numero} : vérifie les infos puis émets le nouveau contrat.` })
    setView('editor')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Make Contrat</div>
        <nav className="tabs" aria-label="Sections">
          <button type="button" className={view === 'editor' ? 'tab active' : 'tab'} onClick={() => setView('editor')}>
            Nouveau contrat
          </button>
          <button type="button" className={view === 'history' ? 'tab active' : 'tab'} onClick={() => setView('history')}>
            Historique{docCount ? ` (${docCount})` : ''}
          </button>
        </nav>
        <div className="spacer" />
        {view === 'editor' ? (
          <>
            <select className="template-select" value={templateId} onChange={(e) => selectTemplate(e.target.value)}
              aria-label="Modèle de contrat">
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button type="button" className="btn btn-ghost" onClick={reset}>Réinitialiser</button>
            <button type="button" className="btn btn-primary" onClick={issue} disabled={issuing || !numero}
              title={numero ? undefined : 'Indique un numéro avant d\'émettre'}>
              {issuing ? 'Émission…' : `Émettre${numero ? ` ${numero}` : ''}`}
            </button>
          </>
        ) : null}
      </header>

      {view === 'history' ? (
        <main className="history-view">
          <ErrorBoundary fallback={(e, retry) => <SectionError error={e} retry={retry} />}>
            <History templates={templates} onDownload={downloadStored} onDuplicate={duplicate} />
          </ErrorBoundary>
        </main>
      ) : (
        <main className="workspace">
          <aside className="panel">
            <p className="panel-intro">{template.description}</p>
            {notice ? <p className={notice.error ? 'notice error' : 'notice'}>{notice.text}</p> : null}
            <DocForm groups={groups} data={data}
              suggestions={{ [template.labelField]: (knownLabels ?? []).map(String) }}
              onChange={(key, value) => setData((d) => ({ ...d, [key]: value }))} />
          </aside>
          <section className="preview">
            <ErrorBoundary key={template.id} fallback={(e, retry) => <SectionError error={e} retry={retry} />}>
              <PdfPreview document={document} />
            </ErrorBoundary>
          </section>
        </main>
      )}
    </div>
  )
}

/** Erreur limitée à une zone (aperçu, historique) : le reste de l'app reste utilisable. */
function SectionError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="preview-state error">
      <p>Cette zone n'a pas pu s'afficher : {String(error.message || error)}</p>
      <button type="button" className="btn btn-ghost" onClick={retry}>Réessayer</button>
    </div>
  )
}
