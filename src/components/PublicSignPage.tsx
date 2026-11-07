import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { pdf } from '@react-pdf/renderer'
import { fetchRemoteContract, submitRemoteSignature, type RemoteContractRecord } from '../lib/remoteSigning'
import { templates } from '../templates'
import { resolveData } from '../lib/archive'
import { saveBlob } from '../lib/download'
import { parsePhotoItems } from '../lib/format'

interface Props {
  token: string
}

export function PublicSignPage({ token }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<RemoteContractRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Canvas de signature tactile
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDownRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Initialisation et chargement des données du contrat
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const contract = await fetchRemoteContract(token)
        setRecord(contract)
        setSignerName(contract.data.auteurNom || '')
        if (contract.status === 'signed') {
          setSuccess(true)
        }
      } catch (err) {
        setError((err as Error).message || 'Impossible de charger le contrat.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  // Canvas setup
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
  }, [loading, success, record?.status])

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
    if (!canvasRef.current || !hasDrawn || !agreed) return
    try {
      setSubmitting(true)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const updated = await submitRemoteSignature(token, dataUrl, signerName)
      setRecord(updated)
      setSuccess(true)
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la validation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!record) return
    try {
      setDownloading(true)
      const template = templates[0]
      const Doc = template.Document
      const resolved = await resolveData(record.data)
      const blob = await pdf(<Doc data={resolved} />).toBlob()
      saveBlob(blob, template.fileName(resolved))
    } catch (err) {
      alert(`Erreur génération PDF : ${(err as Error).message}`)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="public-sign-page loading-center">
        <div className="loading-card">
          <div className="sign-spinner" />
          <h2>Chargement de votre contrat...</h2>
          <p>Vérification du lien sécurisé en cours</p>
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

  const photos = parsePhotoItems(record.data.annexeImage)

  return (
    <div className="public-sign-page">
      <header className="public-sign-header">
        <div className="public-sign-brand">
          <span className="brand-logo-pill">Évasion Littorale</span>
          <span className="brand-doc-title">Cession de droits d'auteur photographiques</span>
        </div>
        <div className="public-sign-ref">
          Réf. : <strong>{record.contractNumero}</strong>
        </div>
      </header>

      <main className="public-sign-main">
        {success ? (
          <div className="public-sign-card success-card">
            <div className="success-icon-bubble">
              <span className="material-symbols-rounded">verified</span>
            </div>
            <h2>Contrat 100% signé et validé !</h2>
            <p className="success-sub">
              Merci {record.data.auteurNom || ''}, votre signature a bien été enregistrée et apposée sur l’acte officiel.
            </p>

            <div className="success-recap-box">
              <div className="recap-row">
                <span>Réf. contrat :</span>
                <strong>{record.contractNumero}</strong>
              </div>
              <div className="recap-row">
                <span>Bénéficiaire :</span>
                <span>Évasion Littorale (Laurent Jonas)</span>
              </div>
              <div className="recap-row">
                <span>Auteur / Photographe :</span>
                <span>{record.data.auteurNom || 'Non renseigné'}</span>
              </div>
              <div className="recap-row">
                <span>Date de finalisation :</span>
                <span>{record.photographeSignedAt ? new Date(record.photographeSignedAt).toLocaleDateString('fr-FR') : 'Aujourd’hui'}</span>
              </div>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <span className="material-symbols-rounded">download</span>
                <span>{downloading ? 'Génération du PDF...' : 'Télécharger mon exemplaire PDF officiel'}</span>
              </button>
            </div>

            <p className="success-note">
              Un exemplaire a également été transmis directement à Évasion Littorale pour archivage.
            </p>
          </div>
        ) : (
          <div className="public-sign-container">
            {/* Colonne gauche : Synthèse et lecture du contrat */}
            <div className="public-sign-summary-col">
              <div className="public-sign-card">
                <span className="badge-pending-tag">Signature requise</span>
                <h1 className="sign-doc-heading">Signature de votre accord de cession</h1>
                <p className="sign-doc-intro">
                  Bonjour <strong>{record.data.auteurNom || 'cher photographe'}</strong>, <strong>Évasion Littorale</strong> vous invite à signer électroniquement le contrat de cession de droits d'auteur sur vos publications photographiques.
                </p>

                <div className="sign-recap-grid">
                  <div className="recap-item">
                    <span className="recap-lbl">Bénéficiaire (Cessionnaire)</span>
                    <strong className="recap-val">Évasion Littorale — Laurent Jonas</strong>
                  </div>
                  <div className="recap-item">
                    <span className="recap-lbl">Auteur (Cédant)</span>
                    <strong className="recap-val">
                      {record.data.auteurNom || 'À renseigner ci-contre'}
                      {record.data.auteurInstagram ? ` (@${record.data.auteurInstagram.replace(/^@/, '')})` : ''}
                    </strong>
                  </div>
                  <div className="recap-item">
                    <span className="recap-lbl">Durée de la cession</span>
                    <strong className="recap-val">{record.data.dureeAnnees || '3'} ans</strong>
                  </div>
                  <div className="recap-item">
                    <span className="recap-lbl">Modalités</span>
                    <strong className="recap-val">
                      {record.data.remunerationType === 'forfaitaire'
                        ? `Rémunération forfaitaire de ${record.data.remunerationMontant || '0'} €`
                        : 'À titre gracieux (échange de visibilité)'}
                    </strong>
                  </div>
                </div>

                <div className="sign-photos-section">
                  <h3 className="section-mini-title">Photographies faisant l'objet de la cession ({photos.length > 0 ? photos.length : '1+'})</h3>
                  {photos.length > 0 ? (
                    <ul className="sign-photos-list">
                      {photos.map((p, idx) => (
                        <li key={idx} className="sign-photo-item">
                          <span className="photo-num">#{idx + 1}</span>
                          <div className="photo-info">
                            <span className="photo-desc">{p.label || `Photographie n°${idx + 1}`}</span>
                          </div>
                          {p.src ? (
                            <img src={p.src} alt={p.label} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : record.data.annexePublications ? (
                    <div className="text-muted-sm" style={{ whiteSpace: 'pre-line', background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      {record.data.annexePublications}
                    </div>
                  ) : (
                    <p className="text-muted-sm">Publications photographiques définies en annexe du contrat.</p>
                  )}
                </div>

                <div className="sign-pdf-action-box">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                  >
                    <span className="material-symbols-rounded icon-sm">visibility</span>
                    <span>{downloading ? 'Génération en cours...' : 'Consulter le contrat complet (PDF)'}</span>
                  </button>
                  <span className="pdf-sub-hint">Visualisez l'acte juridique au format officiel A4</span>
                </div>
              </div>
            </div>

            {/* Colonne droite : Espace de signature */}
            <div className="public-sign-action-col">
              <div className="public-sign-card signature-pad-card">
                <h2 className="pad-card-title">Votre signature numérique</h2>
                <p className="pad-card-sub">
                  Apposez votre signature directement dans le cadre ci-dessous (au doigt sur mobile, ou à la souris).
                </p>

                <div className="pad-input-group">
                  <label htmlFor="signer-name" className="pad-input-lbl">Votre nom complet :</label>
                  <input
                    id="signer-name"
                    type="text"
                    className="pad-text-input"
                    value={signerName}
                    placeholder="Prénom et Nom"
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

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
                  <span className="canvas-label-hint">Signez ici</span>
                </div>

                <div className="canvas-actions-bar">
                  <button
                    type="button"
                    className="btn btn-ghost btn-small text-danger"
                    onClick={clearCanvas}
                  >
                    <span className="material-symbols-rounded icon-xs">refresh</span>
                    <span>Effacer le tracé</span>
                  </button>
                </div>

                <label className="legal-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    Je déclare avoir pris connaissance des termes du présent contrat de cession et y apposer ma signature avec la mention légale <strong>« Lu et approuvé, bon pour accord »</strong>.
                  </span>
                </label>

                <button
                  type="button"
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={!hasDrawn || !agreed || !signerName.trim() || submitting}
                  onClick={handleSubmit}
                >
                  <span className="material-symbols-rounded">draw</span>
                  <span>{submitting ? 'Validation en cours...' : 'Valider et signer le contrat'}</span>
                </button>

                <p className="legal-security-note">
                  <span className="material-symbols-rounded icon-xs">lock</span>
                  Lien sécurisé et horodaté conforme aux dispositions des articles 1366 et 1367 du Code civil.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
