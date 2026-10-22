import { pdf } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { DocForm } from './components/DocForm'
import { ErrorBoundary } from './components/ErrorBoundary'
import { History } from './components/History'
import { PdfPreview } from './components/PdfPreview'
import { StepWizard } from './components/StepWizard'
import { formatNumber, issueDocument, lastNumber, parseSeq, resolveData, yearOf } from './lib/archive'
import { db, type StoredDocument } from './lib/db'
import { saveBlob } from './lib/download'
import { clearData, loadData, saveData } from './lib/storage'
import type { DocData, DocTemplate } from './lib/types'
import { templates } from './templates'

type View = 'editor' | 'history'
type LayoutMode = 'wizard' | 'split'

async function renderPdf(template: DocTemplate, data: DocData): Promise<void> {
  const Doc = template.Document
  saveBlob(await pdf(<Doc data={data} />).toBlob(), template.fileName(data))
}

export default function App() {
  const [view, setView] = useState<View>('editor')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('wizard')
  const [templateId, setTemplateId] = useState(templates[0].id)
  const template = templates.find((t) => t.id === templateId) ?? templates[0]

  const [data, setData] = useState<DocData>(() => loadData(template.id, template.defaults()))
  const [stepIndex, setStepIndex] = useState(0)
  const [issuing, setIssuing] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => saveData(template.id, data), [template.id, data])

  const { field: numberField, dateField } = template.numbering
  const year = yearOf(data[dateField])
  const last = useLiveQuery(() => lastNumber(template.id, year).catch(() => 0), [template.id, year])
  const seq = parseSeq(data[numberField])
  const numero = seq === null ? '' : formatNumber(year, seq)
  const docCount = useLiveQuery(() => db.documents.count().catch(() => 0), [])
  const knownLabels = useLiveQuery(() => db.documents.orderBy('label').uniqueKeys().catch(() => []), [])

  // Si pas de numéro saisi, on laisse vide pour afficher "Brouillon" proprement sans "CTR-…"
  const previewData = useMemo(() => ({ ...data, [numberField]: numero || '' }), [data, numberField, numero])

  const groups = useMemo(
    () =>
      template.groups.map((g) => ({
        ...g,
        fields: g.fields.map((f) =>
          f.key === numberField && f.type === 'number'
            ? {
                ...f,
                placeholder: String((last ?? 0) + 1),
                hint: last
                  ? `Dernier numéro émis en ${year} : ${formatNumber(year, last)}`
                  : `Aucun contrat émis en ${year} : commence à 1 (${formatNumber(year, 1)})`,
              }
            : f,
        ),
      })),
    [template.groups, numberField, last, year],
  )

  const steps = useMemo(
    () => [
      ...groups.map((g, i) => ({
        title: g.title,
        shortTitle: `${i + 1}. ${g.title.split(' ')[0]}`,
      })),
      { title: 'Rendu & Émission', shortTitle: `${groups.length + 1}. Rendu PDF` },
    ],
    [groups],
  )

  const isRenderStep = stepIndex === groups.length

  const Doc = template.Document
  const document = useMemo(() => <Doc data={previewData} />, [Doc, previewData])

  const selectTemplate = (id: string) => {
    const next = templates.find((t) => t.id === id)!
    setTemplateId(id)
    setData(loadData(next.id, next.defaults()))
    setStepIndex(0)
    setNotice(null)
  }

  const reset = () => {
    clearData(template.id)
    setData(template.defaults())
    setStepIndex(0)
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

  const downloadDraft = async () => {
    try {
      await renderPdf(template, previewData)
      setNotice({ text: 'Brouillon PDF téléchargé.' })
    } catch (e) {
      setNotice({ text: `Téléchargement impossible : ${(e as Error).message}`, error: true })
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
    setData({
      ...t.defaults(),
      ...copy,
      [t.numbering.field]: '',
      [t.numbering.dateField]: t.defaults()[t.numbering.dateField],
    })
    setStepIndex(0)
    setNotice({ text: `Copie de ${doc.numero} : vérifie les étapes puis accède au rendu.` })
    setView('editor')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Make Contrat</div>
        <nav className="tabs" aria-label="Sections">
          <button
            type="button"
            className={view === 'editor' ? 'tab active' : 'tab'}
            onClick={() => setView('editor')}
          >
            Nouveau contrat
          </button>
          <button
            type="button"
            className={view === 'history' ? 'tab active' : 'tab'}
            onClick={() => setView('history')}
          >
            Historique{docCount ? ` (${docCount})` : ''}
          </button>
        </nav>

        <div className="spacer" />

        {view === 'editor' ? (
          <>
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => setLayoutMode((m) => (m === 'wizard' ? 'split' : 'wizard'))}
              title={
                layoutMode === 'wizard'
                  ? 'Basculer en vue côte-à-côte (formulaire + rendu en direct)'
                  : 'Basculer en mode guidé par étapes'
              }
            >
              {layoutMode === 'wizard' ? '◫ Vue scindée' : '📋 Mode par étapes'}
            </button>

            {templates.length > 1 ? (
              <select
                className="template-select"
                value={templateId}
                onChange={(e) => selectTemplate(e.target.value)}
                aria-label="Modèle de contrat"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : null}

            <button type="button" className="btn btn-ghost" onClick={reset}>
              Réinitialiser
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={issue}
              disabled={issuing || !numero}
              title={numero ? undefined : 'Indique un numéro avant d’émettre'}
            >
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
      ) : layoutMode === 'split' ? (
        // Mode scindé classique (deux colonnes)
        <main className="workspace">
          <aside className="panel">
            <p className="panel-intro">{template.description}</p>
            {notice ? <p className={notice.error ? 'notice error' : 'notice'}>{notice.text}</p> : null}
            <DocForm
              groups={groups}
              data={data}
              suggestions={{ [template.labelField]: (knownLabels ?? []).map(String) }}
              onChange={(key, value) => setData((d) => ({ ...d, [key]: value }))}
            />
          </aside>
          <section className="preview">
            <ErrorBoundary key={template.id} fallback={(e, retry) => <SectionError error={e} retry={retry} />}>
              <PdfPreview document={document} />
            </ErrorBoundary>
          </section>
        </main>
      ) : (
        // Mode par étapes (Wizard) : Formulaire d'abord, Rendu ensuite
        <main className="render-container">
          <div className="stepper-bar">
            <StepWizard steps={steps} currentStep={stepIndex} onSelectStep={(idx) => setStepIndex(idx)} />
          </div>

          {notice ? (
            <div style={{ padding: '0 20px', maxWidth: 760, margin: '8px auto 0', width: '100%' }}>
              <p className={notice.error ? 'notice error' : 'notice'}>{notice.text}</p>
            </div>
          ) : null}

          {!isRenderStep ? (
            // ÉTAPES DU FORMULAIRE (AVANT LE RENDU)
            <div className="wizard-view">
              <div className="wizard-card">
                <div className="wizard-header">
                  <span className="wizard-step-badge">
                    Étape {stepIndex + 1} sur {groups.length}
                  </span>
                  <h2 className="wizard-title">{groups[stepIndex]?.title}</h2>
                </div>

                <DocForm
                  groups={groups}
                  activeGroupIndex={stepIndex}
                  data={data}
                  suggestions={{ [template.labelField]: (knownLabels ?? []).map(String) }}
                  onChange={(key, value) => setData((d) => ({ ...d, [key]: value }))}
                />

                <div className="wizard-footer">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStepIndex((s) => s - 1)}
                    >
                      ← Étape précédente
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStepIndex(groups.length)}
                      title="Accéder directement à l’aperçu PDF"
                    >
                      Voir le rendu PDF →
                    </button>

                    {stepIndex < groups.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setStepIndex((s) => s + 1)}
                      >
                        Étape suivante →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setStepIndex(groups.length)}
                      >
                        Valider & voir le rendu →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // DERNIÈRE ÉTAPE : LE RENDU DU PDF (APRÈS LE FORMULAIRE)
            <div className="render-container">
              <div className="render-toolbar">
                <div className="render-meta">
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setStepIndex(0)}
                  >
                    ← Modifier le formulaire
                  </button>
                  <span className="render-badge">
                    {numero ? `Contrat CTR-${numero}` : 'Brouillon non numéroté'}
                  </span>
                  <span>
                    Auteur : <strong>{data.auteurNom || '—'}</strong>
                  </span>
                  <span>
                    Cessionnaire : <strong>{data.cessionnaireDenomination || '—'}</strong>
                  </span>
                </div>

                <div className="render-toolbar-actions">
                  <button type="button" className="btn btn-small btn-ghost" onClick={downloadDraft}>
                    Télécharger brouillon PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={issue}
                    disabled={issuing || !numero}
                    title={numero ? undefined : 'Indique un numéro dans l’étape 1 avant d’émettre'}
                  >
                    {issuing ? 'Émission…' : `Émettre le contrat${numero ? ` ${numero}` : ''}`}
                  </button>
                </div>
              </div>

              <div className="render-frame-wrapper">
                <ErrorBoundary key={template.id} fallback={(e, retry) => <SectionError error={e} retry={retry} />}>
                  <PdfPreview document={document} delay={200} />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  )
}

function SectionError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="preview-state error">
      <p>Cette zone n'a pas pu s'afficher : {String(error.message || error)}</p>
      <button type="button" className="btn btn-ghost" onClick={retry}>
        Réessayer
      </button>
    </div>
  )
}
