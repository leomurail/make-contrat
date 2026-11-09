import { useRef, useState, useEffect, type PointerEvent } from 'react'
import { getSavedBeneficiaireSignature, saveBeneficiaireSignature } from '../lib/contracts'
import { formatDate } from '../lib/format'
import type { DocData } from '../lib/types'
import { ShareSignModal } from './ShareSignModal'

interface Props {
  data: DocData
  onChange: (keyOrUpdates: string | Record<string, string>, value?: string) => void
  contractNumero?: string
  shareToken?: string
  onTokenCreated?: (token: string, expiresAt: string) => void
}

export function DualSignaturePanel({
  data,
  onChange,
  contractNumero = '2026-001',
  shareToken,
  onTokenCreated,
}: Props) {
  const [activeSigner, setActiveSigner] = useState<'beneficiaire' | 'photographe' | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [rememberBeneficiaire, setRememberBeneficiaire] = useState(true)
  const [savedBeneficiaireSig, setSavedBeneficiaireSig] = useState<string>(() => getSavedBeneficiaireSignature())

  const hasBeneficiaire = Boolean(data.cessionnaireSignature && data.cessionnaireSignature.trim() !== '')
  const hasAuteur = Boolean(data.auteurSignature && data.auteurSignature.trim() !== '')

  const onUseSavedBeneficiaire = () => {
    const saved = getSavedBeneficiaireSignature()
    if (saved) {
      onChange({
        cessionnaireSignature: saved,
        cessionnaireLuApprouve: 'true',
      })
    }
  }

  return (
    <div className="dual-signature-section">
      <div className="signature-status-summary">
        <div className="sig-status-badge-wrap">
          {hasBeneficiaire && hasAuteur ? (
            <span className="badge-sig-complete">
              <span className="badge-dot green" /> Contrat 100% Signé (2/2)
            </span>
          ) : hasBeneficiaire ? (
            <span className="badge-sig-partial">
              <span className="badge-dot orange" /> Signé par Évasion Littorale (1/2) — En attente du Photographe
            </span>
          ) : hasAuteur ? (
            <span className="badge-sig-partial">
              <span className="badge-dot orange" /> Signé par le Photographe (1/2) — En attente d'Évasion Littorale
            </span>
          ) : (
            <span className="badge-sig-none">
              <span className="badge-dot gray" /> Aucune signature apposée (0/2)
            </span>
          )}
        </div>
        <p className="sig-status-desc">
          Les signatures numériques tracées directement ci-dessous sont intégrées fidèlement en page 2 du contrat officiel avec la mention légale obligatoire « Lu et approuvé, bon pour accord ».
        </p>

        <div className="sig-meta-bar">
          <div className="sig-meta-field">
            <label htmlFor="sig-ville">Fait à&nbsp;:</label>
            <input
              id="sig-ville"
              type="text"
              className="sig-meta-input"
              value={data.villeSignature || ''}
              placeholder="Saint-Jean-de-Monts"
              onChange={(e) => onChange('villeSignature', e.target.value)}
            />
          </div>
          <div className="sig-meta-field">
            <label htmlFor="sig-date">Date&nbsp;:</label>
            <input
              id="sig-date"
              type="date"
              className="sig-meta-input"
              value={data.dateSignature || ''}
              onChange={(e) => onChange('dateSignature', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dual-sig-cards-grid">
        {/* CARTE BÉNÉFICIAIRE (ÉVASION LITTORALE) */}
        <div className={`sig-card ${hasBeneficiaire ? 'signed' : 'waiting'}`}>
          <div className="sig-card-header">
            <div>
              <span className="sig-party-role">Partie 1</span>
              <h3 className="sig-party-name">Évasion Littorale (Laurent Jonas)</h3>
            </div>
            {hasBeneficiaire ? (
              <span className="sig-check-pill">
                <span className="material-symbols-rounded icon-xs">check</span> Signé
              </span>
            ) : (
              <span className="sig-pending-pill">À signer</span>
            )}
          </div>

          <div className="sig-box">
            {hasBeneficiaire ? (
              <div className="sig-display">
                <div className="sig-handwritten-mention-badge">
                  <span className="material-symbols-rounded icon-xs text-brand">check_box</span>
                  <span className="handwritten-mention-text">« Lu et approuvé, bon pour accord »</span>
                </div>
                <img src={data.cessionnaireSignature} alt="Signature Bénéficiaire" className="sig-img" />
                <div className="sig-actions-row">
                  <button
                    type="button"
                    className="btn btn-small btn-ghost text-danger"
                    onClick={() => {
                      onChange({
                        cessionnaireSignature: '',
                        cessionnaireLuApprouve: '',
                      })
                    }}
                  >
                    Effacer la signature
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={() => setActiveSigner('beneficiaire')}
                  >
                    Redessiner
                  </button>
                </div>
              </div>
            ) : (
              <div className="sig-empty-state">
                <p className="sig-empty-hint">Apposez la signature du représentant légal</p>
                <div className="sig-empty-buttons">
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => setActiveSigner('beneficiaire')}
                  >
                    <span className="material-symbols-rounded icon-sm">draw</span>
                    <span>Signer à l'écran</span>
                  </button>
                  {savedBeneficiaireSig && !hasBeneficiaire ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        className="btn btn-small btn-ghost"
                        onClick={onUseSavedBeneficiaire}
                        title="Utiliser votre signature habituelle mémorisée"
                      >
                        Utiliser ma signature habituelle
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-ghost text-dim"
                        onClick={() => {
                          saveBeneficiaireSignature('')
                          setSavedBeneficiaireSig('')
                        }}
                        title="Supprimer la signature habituelle mémorisée"
                        aria-label="Supprimer la signature habituelle"
                      >
                        <span className="material-symbols-rounded icon-xs">delete</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="sig-meta-footer">
            <span className="sig-meta-item">Fait à {data.villeSignature || 'Saint-Jean-de-Monts'}</span>
            <span className="sig-meta-item">Le {data.dateSignature ? formatDate(data.dateSignature) : 'date du jour'}</span>
          </div>
        </div>

        {/* CARTE PHOTOGRAPHE (L'AUTEUR) */}
        <div className={`sig-card ${hasAuteur ? 'signed' : 'waiting'}`}>
          <div className="sig-card-header">
            <div>
              <span className="sig-party-role">Partie 2</span>
              <h3 className="sig-party-name">
                {data.auteurNom ? data.auteurNom : "L'Auteur / Photographe"}
                {data.auteurInstagram ? ` (@${data.auteurInstagram.replace(/^@/, '')})` : ''}
              </h3>
            </div>
            {hasAuteur ? (
              <span className="sig-check-pill">
                <span className="material-symbols-rounded icon-xs">check</span> Signé
              </span>
            ) : (
              <span className="sig-pending-pill">À signer</span>
            )}
          </div>

          <div className="sig-box">
            {hasAuteur ? (
              <div className="sig-display">
                <div className="sig-handwritten-mention-badge">
                  <span className="material-symbols-rounded icon-xs text-brand">check_box</span>
                  <span className="handwritten-mention-text">« Lu et approuvé, bon pour accord »</span>
                </div>
                <img src={data.auteurSignature} alt="Signature Photographe" className="sig-img" />
                <div className="sig-actions-row">
                  <button
                    type="button"
                    className="btn btn-small btn-ghost text-danger"
                    onClick={() => {
                      onChange({
                        auteurSignature: '',
                        auteurLuApprouve: '',
                      })
                    }}
                  >
                    Effacer la signature
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={() => setActiveSigner('photographe')}
                  >
                    Faire re-signer
                  </button>
                </div>
              </div>
            ) : (
              <div className="sig-empty-state">
                <p className="sig-empty-hint">
                  Envoyez un lien au photographe pour qu’il signe sur son téléphone, ou faites-le signer directement ici.
                </p>
                <div className="sig-empty-buttons-stacked">
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => setShowShareModal(true)}
                  >
                    <span className="material-symbols-rounded icon-sm">link</span>
                    <span>{shareToken ? 'Gérer le lien de signature' : 'Générer un lien de signature'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={() => setActiveSigner('photographe')}
                  >
                    <span className="material-symbols-rounded icon-sm">draw</span>
                    <span>Signer sur cet écran</span>
                  </button>
                </div>
                {shareToken ? (
                  <div className="sig-token-active-pill" onClick={() => setShowShareModal(true)}>
                    <span className="badge-dot orange" />
                    <span>Lien actif envoyé • Cliquer pour voir / vérifier</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="sig-meta-footer">
            <span className="sig-meta-mention">Mention : « Lu et approuvé, bon pour accord »</span>
          </div>
        </div>
      </div>

      {/* MODAL DE SIGNATURE PLEIN ÉCRAN FLUIDE */}
      {activeSigner ? (
        <SignatureModal
          signerTitle={
            activeSigner === 'beneficiaire'
              ? 'Signature Évasion Littorale'
              : `Signature de ${data.auteurNom || 'l’Auteur'}`
          }
          isBeneficiaire={activeSigner === 'beneficiaire'}
          rememberDefault={rememberBeneficiaire}
          onToggleRemember={setRememberBeneficiaire}
          onSave={(dataUrl) => {
            if (activeSigner === 'beneficiaire') {
              onChange({
                cessionnaireSignature: dataUrl,
                cessionnaireLuApprouve: 'true',
              })
              if (rememberBeneficiaire) {
                saveBeneficiaireSignature(dataUrl)
                setSavedBeneficiaireSig(dataUrl)
              }
            } else {
              onChange({
                auteurSignature: dataUrl,
                auteurLuApprouve: 'true',
              })
            }
            setActiveSigner(null)
          }}
          onClose={() => setActiveSigner(null)}
        />
      ) : null}

      {/* MODAL D'ENVOI DE LIEN DE SIGNATURE À DISTANCE */}
      {showShareModal ? (
        <ShareSignModal
          contractNumero={contractNumero}
          data={data}
          shareToken={shareToken}
          onTokenCreated={(tok, expiresAt) => {
            if (onTokenCreated) onTokenCreated(tok, expiresAt)
          }}
          onContractSignedRemotely={(sig, date) => {
            const updates: Record<string, string> = {
              auteurSignature: sig,
              auteurLuApprouve: 'true',
            }
            if (date) updates.dateSignature = date
            onChange(updates)
            setShowShareModal(false)
          }}
          onClose={() => setShowShareModal(false)}
        />
      ) : null}
    </div>
  )
}

function SignatureModal({
  signerTitle,
  isBeneficiaire,
  rememberDefault,
  onToggleRemember,
  onSave,
  onClose,
}: {
  signerTitle: string
  isBeneficiaire: boolean
  rememberDefault: boolean
  onToggleRemember: (val: boolean) => void
  onSave: (dataUrl: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDownRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [agreedMention, setAgreedMention] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
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

  const save = () => {
    if (!canvasRef.current || !hasDrawn || !agreedMention) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div className="sig-modal-backdrop" onClick={onClose}>
      <div className="sig-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="sig-modal-header">
          <div>
            <h3 className="sig-modal-title">{signerTitle}</h3>
            <p className="sig-modal-sub">Tracez votre signature au doigt, au stylet ou à la souris</p>
          </div>
          <button type="button" className="sig-modal-close" onClick={onClose} aria-label="Fermer">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="sig-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={600}
            height={240}
            className="sig-canvas"
            onPointerDown={startStroke}
            onPointerMove={moveStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
          <div className="sig-canvas-guideline" />
          <span className="sig-canvas-label">Signer ici</span>
        </div>

        <label className="sig-approval-checkbox-wrap">
          <input
            type="checkbox"
            checked={agreedMention}
            onChange={(e) => setAgreedMention(e.target.checked)}
          />
          <div className="sig-approval-checkbox-content">
            <span className="sig-approval-checkbox-title">Mention manuscrite légale obligatoire :</span>
            <span className="sig-approval-handwritten">« Lu et approuvé, bon pour accord »</span>
          </div>
        </label>

        {isBeneficiaire ? (
          <label className="sig-remember-checkbox">
            <input
              type="checkbox"
              checked={rememberDefault}
              onChange={(e) => onToggleRemember(e.target.checked)}
            />
            <span>Mémoriser cette signature pour mes prochains contrats</span>
          </label>
        ) : null}

        <div className="sig-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={clearCanvas}>
            Effacer
          </button>
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={!hasDrawn || !agreedMention}
          >
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  )
}
