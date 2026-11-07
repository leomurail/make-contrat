import { useState } from 'react'
import type { DocData } from '../lib/types'
import { createRemoteSignLink, checkRemoteContractStatus } from '../lib/remoteSigning'

interface Props {
  contractNumero: string
  data: DocData
  shareToken?: string
  onTokenCreated: (token: string, expiresAt: string) => void
  onContractSignedRemotely: (auteurSignature: string, dateSignature?: string) => void
  onClose: () => void
}

export function ShareSignModal({
  contractNumero,
  data,
  shareToken: initialShareToken,
  onTokenCreated,
  onContractSignedRemotely,
  onClose,
}: Props) {
  const [token, setToken] = useState<string | null>(initialShareToken || null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkStatusMessage, setCheckStatusMessage] = useState<string | null>(null)

  const shareUrl = token ? `${window.location.origin}/signer?token=${token}` : ''
  const auteurNom = data.auteurNom ? data.auteurNom.trim() : 'Cher photographe'

  const emailSubject = `Signature de votre contrat de cession de droits d'auteur — Évasion Littorale (Réf. ${contractNumero})`
  const emailBody = `Bonjour ${auteurNom},

Dans le cadre de notre collaboration avec Évasion Littorale, voici le lien sécurisé pour consulter et apposer votre signature sur le contrat de cession de droits d'auteur photographiques (Réf. ${contractNumero}) :

👉 ${shareUrl}

La signature s'effectue en quelques secondes au doigt ou à la souris sur votre smartphone ou votre ordinateur. Vous pourrez y télécharger directement votre exemplaire PDF officiel signé par les deux parties.

Bien cordialement,
Laurent Jonas — Évasion Littorale
contact@evasion-littorale.fr`

  const handleCreateLink = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await createRemoteSignLink(contractNumero, data)
      setToken(res.token)
      onTokenCreated(res.token, res.expiresAt)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création du lien.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(emailBody)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2500)
  }

  const handleOpenMailApp = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.location.href = mailto
  }

  const handleCheckStatus = async () => {
    if (!token) return
    try {
      setChecking(true)
      setCheckStatusMessage(null)
      const res = await checkRemoteContractStatus(token)
      if (res.status === 'signed' && res.contract) {
        setCheckStatusMessage('✅ Le photographe a signé ! La signature a été synchronisée.')
        onContractSignedRemotely(
          res.contract.data.auteurSignature,
          res.contract.data.dateSignature,
        )
      } else if (res.status === 'pending_photographer') {
        setCheckStatusMessage('⏳ Le contrat est toujours en attente de la signature du photographe.')
      } else {
        setCheckStatusMessage('Lien introuvable ou expiré.')
      }
    } catch (err) {
      setCheckStatusMessage(`Erreur de synchronisation : ${(err as Error).message}`)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="sig-modal-backdrop" onClick={onClose}>
      <div className="share-sign-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sig-modal-header">
          <div>
            <span className="badge-remote-tag">Signature à distance</span>
            <h3 className="sig-modal-title">Envoyer au photographe pour signature</h3>
            <p className="sig-modal-sub">
              Transmettez un lien unique et sécurisé pour qu'il signe le contrat depuis son smartphone ou ordinateur.
            </p>
          </div>
          <button type="button" className="sig-modal-close" onClick={onClose} aria-label="Fermer">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {error ? (
          <div className="modal-error-banner">
            <span className="material-symbols-rounded icon-sm">warning</span>
            <span>{error}</span>
          </div>
        ) : null}

        {!token ? (
          <div className="share-initial-state">
            <div className="share-ready-card">
              <span className="material-symbols-rounded share-large-icon">forward_to_inbox</span>
              <h4>Prêt à envoyer à {data.auteurNom || 'l’Auteur'} ?</h4>
              <p>
                Le contrat sera enregistré dans votre espace sécurisé en ligne pendant 14 jours.
                Vous obtiendrez un lien direct et un modèle d'e-mail pré-rempli.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleCreateLink}
                disabled={loading}
              >
                <span className="material-symbols-rounded">link</span>
                <span>{loading ? 'Génération du lien sécurisé...' : 'Générer le lien de signature'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="share-active-state">
            {/* BLOC 1 : LIEN DIRECT */}
            <div className="share-box-section">
              <label className="share-box-lbl">Lien direct de signature :</label>
              <div className="share-url-row">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="share-url-input"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  className={`btn ${copiedLink ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopyLink}
                >
                  <span className="material-symbols-rounded icon-sm">
                    {copiedLink ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <span className="share-box-hint">
                🔒 Jeton cryptographique unique à usage unique • Expire automatiquement après 14 jours.
              </span>
            </div>

            {/* BLOC 2 : MODÈLE D'EMAIL PRÊT À L'EMPLOI */}
            <div className="share-box-section">
              <div className="share-email-header">
                <label className="share-box-lbl">Message type prêt pour e-mail ou WhatsApp :</label>
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={handleCopyEmail}
                >
                  <span className="material-symbols-rounded icon-xs">
                    {copiedEmail ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedEmail ? 'Message copié !' : 'Copier le texte'}</span>
                </button>
              </div>
              <textarea
                readOnly
                className="share-email-textarea"
                rows={5}
                value={emailBody}
              />
              <div className="share-email-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={handleOpenMailApp}
                >
                  <span className="material-symbols-rounded icon-sm">mail</span>
                  <span>Ouvrir dans mon application Mail</span>
                </button>
              </div>
            </div>

            {/* BLOC 3 : STATUT EN DIRECT */}
            <div className="share-status-bar">
              <div className="share-status-info">
                <span className="status-dot orange" />
                <span>Statut : En attente de la signature du photographe</span>
              </div>
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={handleCheckStatus}
                disabled={checking}
              >
                <span className="material-symbols-rounded icon-xs">sync</span>
                <span>{checking ? 'Vérification...' : 'Vérifier la signature'}</span>
              </button>
            </div>

            {checkStatusMessage ? (
              <p className="share-check-feedback">{checkStatusMessage}</p>
            ) : null}
          </div>
        )}

        <div className="sig-modal-actions">
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
