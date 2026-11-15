export interface LegalFooterProps {
  onOpen: () => void
}

export interface LegalNoticeModalProps {
  open: boolean
  onClose: () => void
}

/** Pied de page affichant l'éditeur légal et le lien vers les mentions légales et la politique RGPD. */
export function LegalFooter({ onOpen }: LegalFooterProps) {
  return (
    <footer className="public-sign-footer">
      <span>Léo Murail — Entrepreneur individuel (SIRET 983 299 785 00011)</span>
      <button type="button" className="public-footer-link" onClick={onOpen}>
        Mentions légales &amp; Politique de confidentialité (RGPD)
      </button>
    </footer>
  )
}

/** Modale des mentions légales (LCEN) et de la politique de confidentialité (RGPD art. 13). */
export function LegalNoticeModal({ open, onClose }: LegalNoticeModalProps) {
  if (!open) return null

  return (
    <div
      className="sig-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Mentions légales et politique de confidentialité"
      onClick={onClose}
    >
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sig-modal-header">
          <div>
            <h3 className="sig-modal-title">Mentions légales &amp; Politique de confidentialité</h3>
            <p className="sig-modal-sub">Informations réglementaires (LCEN &amp; RGPD art. 13)</p>
          </div>
          <button
            type="button"
            className="sig-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="legal-modal-section">
          <h4>1. Éditeur du service &amp; directeur de publication (LCEN)</h4>
          <p>
            <strong>Léo Murail</strong> — Entrepreneur individuel (EI) · Programmation informatique (NAF 62.01Z)
            <br />
            5 Place des Tourterelles, 85220 La Chaize-Giraud, France
            <br />
            SIREN : 983 299 785 — SIRET : 983 299 785 00011
            <br />
            E-mail : <a href="mailto:contact@leomurail.fr">contact@leomurail.fr</a> — Téléphone :{' '}
            <a href="tel:+33252431209">02 52 43 12 09</a>
            <br />
            Directeur de la publication : Léo Murail
          </p>
        </div>

        <div className="legal-modal-section">
          <h4>2. Hébergement &amp; sous-traitance technique</h4>
          <p>
            Application et fonctions Edge hébergées par <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a> — +1 (559) 288-7060).
            <br />
            Stockage temporaire des actes en cours de signature assuré sur <strong>Upstash Redis</strong> (Upstash, Inc., États-Unis —{' '}
            <a href="https://upstash.com" target="_blank" rel="noreferrer">upstash.com</a> — support@upstash.com).
          </p>
        </div>

        <div className="legal-modal-section">
          <h4>3. Politique de confidentialité : responsable de traitement &amp; finalité (RGPD)</h4>
          <p>
            Le responsable du traitement est <strong>Léo Murail</strong> (Entrepreneur individuel, SIRET 983 299 785 00011, 5 Place des Tourterelles, 85220 La Chaize-Giraud —{' '}
            <a href="mailto:contact@leomurail.fr">contact@leomurail.fr</a> —{' '}
            <a href="tel:+33252431209">02 52 43 12 09</a>).
          </p>
          <p style={{ marginTop: 6 }}>
            Les données renseignées dans le contrat (nom, prénom, adresse postale, e-mail, compte Instagram, signature manuscrite, date et heure d’approbation et photographies associées) sont traitées exclusivement pour l’établissement, la signature électronique (articles 1366 et 1367 du Code civil) et la preuve du contrat (<strong>art. 6.1.b du RGPD</strong> : exécution contractuelle). Aucune adresse IP ni empreinte de navigateur n’est collectée dans les actes signés.
          </p>
        </div>

        <div className="legal-modal-section">
          <h4>4. Durée de conservation &amp; transferts hors UE</h4>
          <ul>
            <li>
              <strong>Sur le serveur de signature :</strong> 14 jours maximum à compter de la création du lien, réduits automatiquement à <strong>48 heures</strong> après signature pour permettre le téléchargement du PDF.
            </li>
            <li>
              <strong>Archives contractuelles :</strong> conservées par le responsable de traitement pendant la durée du contrat et les délais légaux de prescription applicables.
            </li>
            <li>
              <strong>Transferts hors UE :</strong> le routage applicatif via Vercel Inc. (et le cas échéant le cache Upstash) s’effectue avec les garanties encadrées applicables (Data Privacy Framework / Clauses Contractuelles Types).
            </li>
          </ul>
        </div>

        <div className="legal-modal-section">
          <h4>5. Cookies, traceurs &amp; ressources tierces</h4>
          <p>
            Ce service n’utilise aucun cookie publicitaire, aucun outil de mesure d’audience et toutes les polices sont auto-hébergées localement sans appel à des serveurs tiers.
          </p>
        </div>

        <div className="legal-modal-section">
          <h4>6. Vos droits</h4>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition en écrivant à{' '}
            <a href="mailto:contact@leomurail.fr">contact@leomurail.fr</a> ou par téléphone au{' '}
            <a href="tel:+33252431209">02 52 43 12 09</a>. Vous pouvez également introduire une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>).
          </p>
        </div>

        <div className="sig-modal-actions" style={{ marginTop: 20 }}>
          <div className="spacer" />
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
