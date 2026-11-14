import { useMemo, useState, useEffect } from 'react'
import type { DocData, DocTemplate } from '../lib/types'
import { DocForm } from './DocForm'
import { DualSignaturePanel } from './DualSignaturePanel'
import { PdfPreview } from './PdfPreview'
import { ErrorBoundary } from './ErrorBoundary'
import { parsePhotoItems } from '../lib/format'

interface Props {
  template: DocTemplate
  data: DocData
  onChange: (keyOrUpdates: string | Record<string, string>, value?: string) => void
  onSaveAndBack: () => void
  onDownloadPdf: () => Promise<void>
  onDownloadDocx?: () => Promise<void>
  contractNumero?: string
  shareToken?: string
  onTokenCreated?: (token: string, expiresAt: string) => void
  onTokenRevoked?: () => void
}

export function StandardWorkflow({
  template,
  data,
  onChange,
  onSaveAndBack,
  onDownloadPdf,
  onDownloadDocx,
  contractNumero,
  shareToken,
  onTokenCreated,
  onTokenRevoked,
}: Props) {
  // Mode Standard : étapes 0 (Photographe), 1 (Photos), 2 (Signatures), 3 (Aperçu & Rendu)
  const [standardStep, setStandardStep] = useState<0 | 1 | 2 | 3>(0)
  
  // Mode Expert : étapes 0 (Photographe), 1 (Bénéficiaire), 2 (Conditions & Durée), 3 (Photos), 4 (Signatures), 5 (Aperçu & Rendu)
  const [expertStep, setExpertStep] = useState<number>(0)
  const [expertMode, setExpertMode] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false)
  const [fitWidth, setFitWidth] = useState(false)

  const Doc = template.Document
  const previewDocument = useMemo(() => <Doc data={data} />, [Doc, data])

  const photoCount = parsePhotoItems(data.annexeImage).length
  const hasAuteur = Boolean(data.auteurSignature && data.auteurSignature.trim() !== '')
  const hasBeneficiaire = Boolean(data.cessionnaireSignature && data.cessionnaireSignature.trim() !== '')

  // Définition des étapes du Mode Expert
  const expertStepsList = useMemo(
    () => [
      { num: 1, title: 'Photographe' },
      { num: 2, title: 'Bénéficiaire' },
      { num: 3, title: 'Conditions' },
      { num: 4, title: 'Photos' },
      { num: 5, title: 'Signatures' },
      { num: 6, title: 'Rendu' },
    ],
    [],
  )

  const photosGroup = template.groups[3] // Photos cédées

  // Fermer le mode plein écran sur Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenPreview(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Bloquer le défilement de la page principale quand le plein écran est actif
  useEffect(() => {
    if (isFullscreenPreview) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`
      }
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isFullscreenPreview])

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      await onDownloadPdf()
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadDocx = async () => {
    if (!onDownloadDocx) return
    setDownloading(true)
    try {
      await onDownloadDocx()
    } finally {
      setDownloading(false)
    }
  }

  const toggleExpertMode = () => {
    if (!expertMode) {
      // Transition Standard -> Expert : mapper l'étape courante
      if (standardStep === 0) setExpertStep(0)
      else if (standardStep === 1) setExpertStep(3) // Photos
      else if (standardStep === 2) setExpertStep(4) // Signatures
      else setExpertStep(5) // Aperçu & Rendu
      setExpertMode(true)
    } else {
      // Transition Expert -> Standard : mapper l'étape courante
      if (expertStep === 0) setStandardStep(0)
      else if (expertStep === 1 || expertStep === 2 || expertStep === 3) setStandardStep(1)
      else if (expertStep === 4) setStandardStep(2)
      else setStandardStep(3)
      setExpertMode(false)
    }
  }

  return (
    <div className="standard-workflow-container">
      {/* BARRE DE NAVIGATION SUPÉRIEURE DU WORKFLOW */}
      <div className="workflow-top-nav">
        <button
          type="button"
          className="btn btn-ghost btn-nav-back"
          onClick={onSaveAndBack}
          title="Retour à mes contrats"
        >
          <span className="material-symbols-rounded icon-sm">arrow_back</span>
          <span>Retour</span>
        </button>

        {/* NAVIGATION PAR ÉTAPES : MODE STANDARD OU MODE EXPERT */}
        {!expertMode ? (
          <div className="workflow-stepper">
            <button
              type="button"
              className={`workflow-step-btn ${standardStep === 0 ? 'active' : ''} ${data.auteurNom ? 'done' : ''}`}
              onClick={() => setStandardStep(0)}
            >
              <span className="step-num">
                {data.auteurNom && standardStep !== 0 ? (
                  <span className="material-symbols-rounded icon-xs">check</span>
                ) : (
                  '1'
                )}
              </span>
              <span className="step-label">Photographe</span>
            </button>
            <span className="material-symbols-rounded step-chevron">chevron_right</span>

            <button
              type="button"
              className={`workflow-step-btn ${standardStep === 1 ? 'active' : ''} ${photoCount > 0 ? 'done' : ''}`}
              onClick={() => setStandardStep(1)}
            >
              <span className="step-num">
                {photoCount > 0 && standardStep !== 1 ? (
                  <span className="material-symbols-rounded icon-xs">check</span>
                ) : (
                  '2'
                )}
              </span>
              <span className="step-label">Photos ({photoCount})</span>
            </button>
            <span className="material-symbols-rounded step-chevron">chevron_right</span>

            <button
              type="button"
              className={`workflow-step-btn ${standardStep === 2 ? 'active' : ''} ${hasAuteur && hasBeneficiaire ? 'done' : ''}`}
              onClick={() => setStandardStep(2)}
            >
              <span className="step-num">
                {hasAuteur && hasBeneficiaire && standardStep !== 2 ? (
                  <span className="material-symbols-rounded icon-xs">check</span>
                ) : (
                  '3'
                )}
              </span>
              <span className="step-label">Signatures</span>
            </button>
            <span className="material-symbols-rounded step-chevron">chevron_right</span>

            <button
              type="button"
              className={`workflow-step-btn ${standardStep === 3 ? 'active' : ''}`}
              onClick={() => setStandardStep(3)}
            >
              <span className="step-num">4</span>
              <span className="step-label">Aperçu & Rendu</span>
            </button>
          </div>
        ) : (
          <div className="workflow-stepper expert-stepper">
            {expertStepsList.map((st, idx) => (
              <div key={idx} className="expert-step-item">
                <button
                  type="button"
                  className={`workflow-step-btn ${expertStep === idx ? 'active' : ''}`}
                  onClick={() => setExpertStep(idx)}
                >
                  <span className="step-num">{st.num}</span>
                  <span className="step-label">{st.title}</span>
                </button>
                {idx < expertStepsList.length - 1 ? (
                  <span className="material-symbols-rounded step-chevron">chevron_right</span>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS RAPIDES ALIGNÉES HORIZONTALEMENT */}
        <div className="workflow-nav-actions">
          <button
            type="button"
            className="btn btn-ghost btn-small btn-icon-only"
            onClick={() => setIsFullscreenPreview(true)}
            title="Aperçu plein écran"
            aria-label="Aperçu plein écran"
          >
            <span className="material-symbols-rounded icon-sm">fullscreen</span>
          </button>
          <button
            type="button"
            className={`btn btn-small btn-nav-action ${expertMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={toggleExpertMode}
            title={
              expertMode
                ? 'Revenir au parcours simplifié en 4 étapes'
                : 'Activer le mode expert pas à pas avec toutes les clauses'
            }
          >
            <span className="material-symbols-rounded icon-sm">{expertMode ? 'check_circle' : 'tune'}</span>
            <span>{expertMode ? 'Mode Expert' : 'Mode Expert'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONTENU : SOIT MODE EXPERT PAS À PAS, SOIT MODE STANDARD ÉPURÉ
      ========================================================================= */}
      {expertMode ? (
        /* MODE EXPERT : DÉCOUPÉ EN 6 ÉTAPES GUIDÉES */
        <div className="standard-step-card">
          {/* ÉTAPE EXPERT 1 : PHOTOGRAPHE */}
          {expertStep === 0 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Identité et Coordonnées du Photographe</h2>
                <p>{template.groups[0].description}</p>
              </div>

              <DocForm
                groups={[template.groups[0]]}
                data={data}
                activeGroupIndex={0}
                onChange={onChange}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={onSaveAndBack}>
                  Sauvegarder et quitter
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setExpertStep(1)}
                >
                  Continuer : Bénéficiaire →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE EXPERT 2 : BÉNÉFICIAIRE (ÉVASION LITTORALE) */}
          {expertStep === 1 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Informations de votre structure (Le Bénéficiaire)</h2>
                <p>{template.groups[1].description}</p>
              </div>

              <div className="wizard-helper-banner" style={{ marginBottom: 16 }}>
                <span className="wizard-helper-icon">
                  <span className="material-symbols-rounded icon-xs">check</span>
                </span>
                <div className="wizard-helper-text">
                  <strong>Pré-remplissage conforme Évasion Littorale</strong>
                  <span>SIRET 103 726 881 00016 &amp; titulaire Stéphanie JONAS EI pré-configurés.</span>
                </div>
              </div>

              <DocForm
                groups={[template.groups[1]]}
                data={data}
                activeGroupIndex={0}
                onChange={onChange}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setExpertStep(0)}>
                  ← Étape précédente (Photographe)
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setExpertStep(2)}
                >
                  Continuer : Supports & Conditions →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE EXPERT 3 : SUPPORTS & CONDITIONS */}
          {expertStep === 2 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Supports d'exploitation, Durée et Rémunération</h2>
                <p>{template.groups[2].description}</p>
              </div>

              <DocForm
                groups={[template.groups[2]]}
                data={data}
                activeGroupIndex={0}
                onChange={onChange}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setExpertStep(1)}>
                  ← Étape précédente (Bénéficiaire)
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setExpertStep(3)}
                >
                  Continuer : Dépôt des photos →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE EXPERT 4 : PHOTOS */}
          {expertStep === 3 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Photographies et Captures d'écran</h2>
                <p>Glissez-déposez ici les photos ou captures Instagram visées par la cession.</p>
              </div>

              <DocForm
                groups={[photosGroup]}
                data={data}
                activeGroupIndex={0}
                onChange={onChange}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setExpertStep(2)}>
                  ← Étape précédente (Conditions)
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setExpertStep(4)}
                >
                  Continuer : Signatures des Parties →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE EXPERT 5 : SIGNATURES DES DEUX PARTIES */}
          {expertStep === 4 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Signatures des Deux Parties</h2>
                <p>
                  Apposez les signatures d’Évasion Littorale et du photographe ainsi que la date et le lieu. L’aperçu complet en plein écran est disponible à l’étape suivante.
                </p>
              </div>

              <DualSignaturePanel
                data={data}
                onChange={onChange}
                contractNumero={contractNumero}
                shareToken={shareToken}
                onTokenCreated={onTokenCreated}
                onTokenRevoked={onTokenRevoked}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setExpertStep(3)}>
                  ← Étape précédente (Photos)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => setExpertStep(5)}
                >
                  Continuer : Aperçu & Téléchargement →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE EXPERT 6 : APERÇU DU CONTRAT EN GRAND & TÉLÉCHARGEMENT */}
          {expertStep === 5 ? (
            <div className="step-panel-render">
              <div className="step-panel-header">
                <div className="preview-top-badge-row">
                  {hasAuteur && hasBeneficiaire ? (
                    <span className="badge-sig-complete">
                      <span className="badge-dot green" /> Contrat complet & 100% signé (2/2)
                    </span>
                  ) : (
                    <span className="badge-sig-partial">
                      <span className="badge-dot orange" /> En attente de signature
                    </span>
                  )}
                </div>
                <h2>Aperçu du Contrat Officiel & Téléchargement</h2>
                <p>
                  Vérifiez le contrat final généré (2 pages conformes). Affichez-le en plein écran immersif pour relire confortablement chaque clause ou téléchargez-le immédiatement.
                </p>
              </div>

              <div className="render-actions-bar">
                <div className="render-actions-left">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setExpertStep(4)}
                  >
                    <span className="material-symbols-rounded icon-sm">draw</span>
                    <span>Signatures</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setExpertStep(3)}
                  >
                    <span className="material-symbols-rounded icon-sm">photo_library</span>
                    <span>Photos</span>
                  </button>
                </div>

                <div className="render-actions-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-fullscreen-toggle"
                    onClick={() => setIsFullscreenPreview(true)}
                    title="Agrandir en plein écran immersif"
                  >
                    <span className="material-symbols-rounded icon-sm">fullscreen</span>
                    <span>Plein écran</span>
                  </button>

                  {onDownloadDocx ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleDownloadDocx}
                      disabled={downloading}
                      title="Télécharger une version Word modifiable"
                    >
                      <span className="material-symbols-rounded icon-sm">description</span>
                      <span>Word (.docx)</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-primary btn-large"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    title="Télécharger le contrat officiel au format PDF"
                  >
                    <span className="material-symbols-rounded icon-sm">download</span>
                    <span>{downloading ? 'Génération…' : 'Télécharger le PDF'}</span>
                  </button>
                </div>
              </div>

              <div className="preview-stage-wrapper">
                <div className="preview-header-label">
                  <span>Document contractuel généré (2 pages) :</span>
                  <div className="preview-header-right">
                    <span className="preview-page-hint">Mise à jour en temps réel</span>
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => setIsFullscreenPreview(true)}
                    >
                      <span className="material-symbols-rounded icon-xs">open_in_full</span>
                      <span>Ouvrir en plein écran</span>
                    </button>
                  </div>
                </div>

                <ErrorBoundary fallback={(err, retry) => (
                  <div className="preview-state error">
                    <p>Erreur d'affichage : {err.message}</p>
                    <button type="button" className="btn btn-ghost" onClick={retry}>Réessayer</button>
                  </div>
                )}>
                  <PdfPreview document={previewDocument} delay={150} />
                </ErrorBoundary>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* MODE STANDARD (PAR DÉFAUT) : 3 ÉTAPES RAPIDES */
        <div className="standard-step-card">
          {/* ÉTAPE 1 : INFOS DU PHOTOGRAPHE */}
          {standardStep === 0 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Informations du Photographe (L’Auteur)</h2>
                <p>
                  Indiquez le nom d'état civil et le compte Instagram du créateur des clichés. Ces données permettent d'identifier légalement l'auteur et de générer son crédit photographique obligatoire.
                </p>
              </div>

              <div className="step-fields-wrap">
                <div className="field">
                  <label htmlFor="step-auteurNom">Nom et prénom d'état civil *</label>
                  <input
                    id="step-auteurNom"
                    type="text"
                    value={data.auteurNom || ''}
                    placeholder="Ex : Jean Martin"
                    onChange={(e) => onChange('auteurNom', e.target.value)}
                    autoFocus
                  />
                  <span className="hint">Prénom et nom de la personne qui a pris les photos</span>
                </div>

                <div className="field">
                  <label htmlFor="step-auteurInstagram">Compte Instagram *</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">@</span>
                    <input
                      id="step-auteurInstagram"
                      type="text"
                      value={(data.auteurInstagram || '').replace(/^@+/, '')}
                      placeholder="jean_photos"
                      onChange={(e) => onChange('auteurInstagram', e.target.value)}
                    />
                  </div>
                  <span className="hint">Génère le lien direct de son profil et la mention de crédit photo</span>
                </div>

                <div className="field-grid-2">
                  <div className="field">
                    <label htmlFor="step-auteurEmail">Adresse e-mail (optionnel)</label>
                    <input
                      id="step-auteurEmail"
                      type="email"
                      value={data.auteurEmail || ''}
                      placeholder="jean.martin@email.com"
                      onChange={(e) => onChange('auteurEmail', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="step-auteurAdresse">Adresse postale (optionnel)</label>
                    <input
                      id="step-auteurAdresse"
                      type="text"
                      value={data.auteurAdresse || ''}
                      placeholder="Ex : 12 rue des Pins, 85160 Saint-Jean-de-Monts"
                      onChange={(e) => onChange('auteurAdresse', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={onSaveAndBack}>
                  Sauvegarder et quitter
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStandardStep(1)}
                >
                  Continuer : Dépôt des photos →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE 2 : DÉPÔT DES PHOTOS */}
          {standardStep === 1 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Sélection des Photographies autorisées</h2>
                <p>
                  Glissez-déposez ici les photos ou captures d’écran des publications Instagram que vous souhaitez utiliser. Elles seront automatiquement numérotées, légendées et annexées au contrat.
                </p>
              </div>

              <DocForm
                groups={[photosGroup]}
                data={data}
                activeGroupIndex={0}
                onChange={onChange}
              />

              <div className="step-navigation-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStandardStep(0)}>
                  ← Étape précédente (Photographe)
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStandardStep(2)}
                >
                  Continuer : Signatures des Parties →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE 3 : SIGNATURES DÉDIÉES */}
          {standardStep === 2 ? (
            <div className="step-panel">
              <div className="step-panel-header">
                <h2>Signatures des Deux Parties</h2>
                <p>
                  Apposez les signatures d’Évasion Littorale et du photographe ainsi que la date et le lieu. L’aperçu complet en plein écran est disponible à l’étape suivante.
                </p>
              </div>

              <DualSignaturePanel
                data={data}
                onChange={onChange}
                contractNumero={contractNumero}
                shareToken={shareToken}
                onTokenCreated={onTokenCreated}
                onTokenRevoked={onTokenRevoked}
              />

              <div className="step-navigation-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStandardStep(1)}
                >
                  ← Étape précédente (Photos)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => setStandardStep(3)}
                >
                  Continuer : Aperçu & Téléchargement →
                </button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE 4 : APERÇU DU CONTRAT EN GRAND & TÉLÉCHARGEMENT */}
          {standardStep === 3 ? (
            <div className="step-panel-render">
              <div className="step-panel-header">
                <div className="preview-top-badge-row">
                  {hasAuteur && hasBeneficiaire ? (
                    <span className="badge-sig-complete">
                      <span className="badge-dot green" /> Contrat complet & 100% signé (2/2)
                    </span>
                  ) : (
                    <span className="badge-sig-partial">
                      <span className="badge-dot orange" /> En attente de signature
                    </span>
                  )}
                </div>
                <h2>Aperçu du Contrat Officiel & Téléchargement</h2>
                <p>
                  Vérifiez le document complet généré. Affichez-le en plein écran immersif pour relire confortablement chaque clause ou téléchargez-le directement.
                </p>
              </div>

              <div className="render-actions-bar">
                <div className="render-actions-left">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setStandardStep(2)}
                  >
                    <span className="material-symbols-rounded icon-sm">draw</span>
                    <span>Signatures</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setStandardStep(1)}
                  >
                    <span className="material-symbols-rounded icon-sm">photo_library</span>
                    <span>Photos</span>
                  </button>
                </div>

                <div className="render-actions-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-fullscreen-toggle"
                    onClick={() => setIsFullscreenPreview(true)}
                    title="Agrandir en plein écran immersif"
                  >
                    <span className="material-symbols-rounded icon-sm">fullscreen</span>
                    <span>Plein écran</span>
                  </button>

                  {onDownloadDocx ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleDownloadDocx}
                      disabled={downloading}
                      title="Télécharger une version Word modifiable"
                    >
                      <span className="material-symbols-rounded icon-sm">description</span>
                      <span>Word (.docx)</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-primary btn-large"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    title="Télécharger le contrat officiel au format PDF"
                  >
                    <span className="material-symbols-rounded icon-sm">download</span>
                    <span>{downloading ? 'Génération…' : 'Télécharger le PDF'}</span>
                  </button>
                </div>
              </div>

              <div className="preview-stage-wrapper">
                <div className="preview-header-label">
                  <span>Document contractuel généré (2 pages) :</span>
                  <div className="preview-header-right">
                    <span className="preview-page-hint">Mise à jour en temps réel</span>
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => setIsFullscreenPreview(true)}
                    >
                      <span className="material-symbols-rounded icon-xs">open_in_full</span>
                      <span>Ouvrir en plein écran</span>
                    </button>
                  </div>
                </div>

                <ErrorBoundary fallback={(err, retry) => (
                  <div className="preview-state error">
                    <p>Erreur d'affichage : {err.message}</p>
                    <button type="button" className="btn btn-ghost" onClick={retry}>Réessayer</button>
                  </div>
                )}>
                  <PdfPreview document={previewDocument} delay={150} />
                </ErrorBoundary>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MODAL APERÇU IMMERSIF PLEIN ÉCRAN */}
      {isFullscreenPreview ? (
        <div className="preview-fullscreen-modal" role="dialog" aria-modal="true" aria-label="Aperçu Plein Écran">
          <div className="preview-fullscreen-topbar">
            <div className="preview-fullscreen-title">
              <span className="material-symbols-rounded preview-fullscreen-logo icon-lg">description</span>
              <div>
                <strong>Aperçu Contrat — {data.numero || 'Évasion Littorale'}</strong>
                <span className="preview-fullscreen-sub">
                  {data.auteurNom ? `Photographe : ${data.auteurNom}` : 'Nouveau contrat'} • 2 pages conformes CPI
                </span>
              </div>
            </div>

            <div className="preview-fullscreen-actions">
              <button
                type="button"
                className="btn btn-ghost btn-invert"
                onClick={() => setFitWidth(!fitWidth)}
                title={fitWidth ? "Revenir au format A4 centré (scroll standard)" : "Ajuster à 100% de la largeur de l'écran"}
              >
                <span className="material-symbols-rounded icon-sm">
                  {fitWidth ? 'fit_screen' : 'width_full'}
                </span>
                <span>{fitWidth ? 'Format A4' : 'Pleine largeur'}</span>
              </button>

              {onDownloadDocx ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-invert"
                  onClick={handleDownloadDocx}
                  disabled={downloading}
                >
                  <span className="material-symbols-rounded icon-sm">description</span>
                  <span>Word (.docx)</span>
                </button>
              ) : null}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <span className="material-symbols-rounded icon-sm">download</span>
                <span>{downloading ? 'Génération…' : 'Télécharger le PDF'}</span>
              </button>

              <button
                type="button"
                className="btn-modal-close-icon"
                onClick={() => setIsFullscreenPreview(false)}
                title="Quitter le plein écran (Échap)"
              >
                <span className="material-symbols-rounded icon-sm">close</span>
                <span>Fermer</span>
              </button>
            </div>
          </div>

          <div className="preview-fullscreen-body-wrapper">
            <div className={`preview-fullscreen-doc-container ${fitWidth ? 'full-width' : 'a4-width'}`}>
              <ErrorBoundary fallback={(err, retry) => (
                <div className="preview-state error">
                  <p>Erreur d'affichage : {err.message}</p>
                  <button type="button" className="btn btn-ghost" onClick={retry}>Réessayer</button>
                </div>
              )}>
                <PdfPreview document={previewDocument} delay={100} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
