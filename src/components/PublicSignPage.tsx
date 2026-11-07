import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { pdf } from '@react-pdf/renderer'
import { fetchRemoteContract, submitRemoteSignature, type RemoteContractRecord } from '../lib/remoteSigning'
import { templates } from '../templates'
import { resolveData } from '../lib/archive'
import { saveBlob } from '../lib/download'
import { PdfPreview } from './PdfPreview'
import { ErrorBoundary } from './ErrorBoundary'
import type { DocData } from '../lib/types'

interface Props {
  token: string
}

export function PublicSignPage({ token }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<RemoteContractRecord | null>(null)
  const [resolvedData, setResolvedData] = useState<DocData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [mobileTab, setMobileTab] = useState<'preview' | 'sign'>('preview')
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false)

  // Canvas tactile de signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDownRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const template = templates[0]
  const Doc = template.Document

  // Initialisation et chargement des données du contrat distant
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const contract = await fetchRemoteContract(token)
        setRecord(contract)
        setSignerName(contract.data.auteurNom || '')
        const resolved = await resolveData(contract.data)
        setResolvedData(resolved)
        if (contract.status === 'signed') {
          setSuccess(true)
          setAgreed(true)
        }
      } catch (err) {
        setError((err as Error).message || 'Impossible de charger le contrat.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  // Initialisation du contexte canvas
  useEffect(() => {
    if (loading || success || record?.status === 'signed') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [loading, success, record?.status, mobileTab])

  // Gestion de la touche Échap pour le plein écran
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenPreview(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    }
  }

  const startStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    isDownRef.current = true
    setHasDrawn(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const moveStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDownRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endStroke = () => {
    isDownRef.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSubmit = async () => {
    if (!canvasRef.current || !hasDrawn || !agreed || !signerName.trim()) return
    try {
      setSubmitting(true)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const updated = await submitRemoteSignature(token, dataUrl, signerName.trim(), true)
      setRecord(updated)
      const resolved = await resolveData(updated.data)
      setResolvedData(resolved)
      setSuccess(true)
      setMobileTab('preview')
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la validation du contrat.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!record || !resolvedData) return
    try {
      setDownloading(true)
      const blob = await pdf(<Doc data={resolvedData} />).toBlob()
      saveBlob(blob, template.fileName(resolvedData))
    } catch (err) {
      alert(`Erreur génération PDF : ${(err as Error).message}`)
    } finally {
      setDownloading(false)
    }
  }

  // Document React-PDF mémorisé pour prévisualisation fluide
  const previewDocument = useMemo(() => {
    if (!resolvedData) return null
    return <Doc data={resolvedData} />
  }, [Doc, resolvedData])

  if (loading) {
    return (
      <div className="public-sign-page loading-center">
        <div className="loading-card">
          <div className="sign-spinner" />
          <h2>Chargement de votre contrat...</h2>
          <p>Génération de l'aperçu officiel interactif</p>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="public-sign-page error-center">
        <div className="public-sign-card error-card">
          <div className="error-icon-bubble">
            <span className="material-symbols-rounded">link_off</span>
          </div>
          <h2>Lien invalide ou expiré</h2>
          <p className="error-msg">{error || 'Ce lien de signature n’est plus disponible.'}</p>
          <div className="error-hint">
            Si vous pensez qu’il s’agit d’une erreur, merci de contacter directement Laurent Jonas (Évasion Littorale) pour recevoir un nouveau lien.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="public-sign-page">
      {/* EN-TÊTE FIXE DU CONTRAT PUBLIC */}
      <header className="public-sign-header">
        <div className="public-sign-brand">
          <span className="brand-logo-pill">Évasion Littorale</span>
          <span className="brand-doc-title">Cession de droits d'auteur photographiques</span>
        </div>
        <div className="public-sign-ref">
          Réf. : <strong>{record.contractNumero}</strong>
          {success ? (
            <span className="status-pill status-signed" style={{ marginLeft: 12 }}>
              <span className="material-symbols-rounded icon-xs">verified</span> Contrat 100% Signé
            </span>
          ) : (
            <span className="status-pill status-pending" style={{ marginLeft: 12 }}>
              <span className="material-symbols-rounded icon-xs">pending</span> Signature requise
            </span>
          )}
        </div>
      </header>

      <main className="public-sign-main">
        {/* BANNIÈRE DE SUCCÈS QUAND LE CONTRAT EST SIGNÉ */}
        {success ? (
          <div className="public-sign-card success-banner-card" style={{ marginBottom: 24, textAlign: 'center', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32, color: '#16a34a' }}>verified</span>
              <h2 style={{ margin: 0, fontSize: 22, color: '#14532d' }}>Contrat 100% signé et validé !</h2>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#166534' }}>
              Merci <strong>{record.data.auteurNom || ''}</strong>, votre signature et la mention manuscrite légale ont été apposées avec succès sur l’acte officiel.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <span className="material-symbols-rounded icon-sm">download</span>
                <span>{downloading ? 'Génération du PDF...' : 'Télécharger mon exemplaire PDF signé (2/2)'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* SÉLECTEUR D'ONGLETS POUR MOBILE (< 860px) */}
        {!success ? (
          <div className="public-sign-tabs-mobile">
            <button
              type="button"
              className={`public-sign-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
              onClick={() => setMobileTab('preview')}
            >
              <span className="material-symbols-rounded icon-sm">description</span>
              <span>1. Consulter le contrat</span>
            </button>
            <button
              type="button"
              className={`public-sign-tab-btn ${mobileTab === 'sign' ? 'active' : ''}`}
              onClick={() => setMobileTab('sign')}
            >
              <span className="material-symbols-rounded icon-sm">draw</span>
              <span>2. Signer l'acte</span>
            </button>
          </div>
        ) : null}

        {/* CONTENEUR PRINCIPAL EN SPLIT-SCREEN SUR DESKTOP */}
        <div className="public-sign-container">
          {/* COLONNE GAUCHE : PRÉVISUALISATION DIRECTE ET INTERACTIVE DU CONTRAT */}
          <div
            className="public-preview-col"
            style={{ display: !success && mobileTab === 'sign' ? 'none' : 'flex' }}
          >
            <div className="public-preview-header-bar">
              <div className="public-preview-title">
                <span className="material-symbols-rounded icon-sm text-brand">menu_book</span>
                <span>Document contractuel officiel A4 (Pages & Clauses)</span>
              </div>
              <div className="public-preview-actions">
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() => setIsFullscreenPreview(true)}
                  title="Ouvrir le contrat en plein écran pour une lecture confortable"
                >
                  <span className="material-symbols-rounded icon-xs">open_in_full</span>
                  <span>Plein écran</span>
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  title="Télécharger le document PDF"
                >
                  <span className="material-symbols-rounded icon-xs">download</span>
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="public-preview-frame-wrap">
              {previewDocument ? (
                <ErrorBoundary
                  fallback={(err, retry) => (
                    <div className="preview-state error">
                      <p>Erreur d'affichage : {err.message}</p>
                      <button type="button" className="btn btn-ghost" onClick={retry}>
                        Réessayer
                      </button>
                    </div>
                  )}
                >
                  <PdfPreview document={previewDocument} delay={100} />
                </ErrorBoundary>
              ) : null}
            </div>

            {/* Bouton d'action flottant en bas d'écran sur mobile pour passer à la signature */}
            {!success ? (
              <div className="public-mobile-floating-bar">
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => setMobileTab('sign')}
                >
                  <span className="material-symbols-rounded">draw</span>
                  <span>Passer à la signature du contrat ✍️</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* COLONNE DROITE : PANNEAU TACTILE DE SIGNATURE INTERACTIF */}
          {!success ? (
            <div
              className="public-sign-action-col"
              style={{ display: mobileTab === 'preview' ? 'none' : 'block' }}
            >
              <div className="public-sign-card signature-pad-card">
                <h2 className="pad-card-title">Votre signature électronique</h2>
                <p className="pad-card-sub">
                  Vérifiez votre nom, cochez la mention légale et apposez votre signature au doigt ou à la souris.
                </p>

                {/* Champ Nom du signataire */}
                <div className="pad-input-group">
                  <label htmlFor="signer-name" className="pad-input-lbl">
                    Votre prénom et nom d'auteur :
                  </label>
                  <input
                    id="signer-name"
                    type="text"
                    className="pad-text-input"
                    value={signerName}
                    placeholder="Prénom et Nom"
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

                {/* Case à cocher obligatoire : Lu et approuvé */}
                <label className="legal-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div>
                    <span>
                      Je déclare avoir pris connaissance des termes du présent contrat de cession et y apposer la mention légale obligatoire :
                    </span>
                    <span className="public-sign-handwriting-preview">
                      « Lu et approuvé, bon pour accord »
                    </span>
                  </div>
                </label>

                {/* Zone de tracé manuscrit */}
                <div className="pad-canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="public-sig-canvas"
                    onPointerDown={startStroke}
                    onPointerMove={moveStroke}
                    onPointerUp={endStroke}
                    onPointerCancel={endStroke}
                  />
                  <div className="canvas-guideline" />
                  <span className="canvas-label-hint">
                    {hasDrawn ? 'Signature capturée ✓' : 'Tracez votre signature ici'}
                  </span>
                </div>

                <div className="canvas-actions-bar">
                  <button
                    type="button"
                    className="btn btn-ghost btn-small text-danger"
                    onClick={clearCanvas}
                    disabled={!hasDrawn}
                  >
                    <span className="material-symbols-rounded icon-xs">refresh</span>
                    <span>Effacer le tracé</span>
                  </button>
                </div>

                {/* Bouton de validation final */}
                <button
                  type="button"
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={!hasDrawn || !agreed || !signerName.trim() || submitting}
                  onClick={handleSubmit}
                >
                  <span className="material-symbols-rounded">verified</span>
                  <span>{submitting ? 'Validation et horodatage...' : 'Valider et signer le contrat'}</span>
                </button>

                <p className="legal-security-note">
                  <span className="material-symbols-rounded icon-xs">lock</span>
                  Lien sécurisé et horodaté conforme aux dispositions des articles 1366 et 1367 du Code civil.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* MODAL APERÇU IMMERSIF PLEIN ÉCRAN */}
      {isFullscreenPreview && previewDocument ? (
        <div className="preview-fullscreen-modal" role="dialog" aria-modal="true" aria-label="Aperçu Plein Écran">
          <div className="preview-fullscreen-topbar">
            <div className="preview-fullscreen-title">
              <span className="material-symbols-rounded preview-fullscreen-logo icon-lg">description</span>
              <div>
                <strong>Contrat de cession — Réf. {record.contractNumero}</strong>
                <span className="preview-fullscreen-sub">
                  Évasion Littorale & {record.data.auteurNom || 'Photographe'} • Acte officiel
                </span>
              </div>
            </div>

            <div className="preview-fullscreen-actions">
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <span className="material-symbols-rounded icon-xs">download</span>
                <span>{downloading ? 'Génération…' : 'Télécharger le PDF'}</span>
              </button>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setIsFullscreenPreview(false)}
                aria-label="Fermer le plein écran"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
          </div>

          <div className="preview-fullscreen-content">
            <ErrorBoundary
              fallback={(err, retry) => (
                <div className="preview-state error">
                  <p>Erreur d'affichage : {err.message}</p>
                  <button type="button" className="btn btn-ghost" onClick={retry}>
                    Réessayer
                  </button>
                </div>
              )}
            >
              <PdfPreview document={previewDocument} delay={100} />
            </ErrorBoundary>
          </div>
        </div>
      ) : null}
    </div>
  )
}
