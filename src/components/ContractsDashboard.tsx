import { useState } from 'react'
import type { ContractItem } from '../lib/db'
import { formatDate } from '../lib/format'
import { parsePhotoItems } from '../lib/format'

interface Props {
  contracts: ContractItem[]
  onNewContract: () => void
  onOpenContract: (c: ContractItem) => void
  onQuickSign: (c: ContractItem) => void
  onDuplicate: (c: ContractItem) => void
  onDelete: (id: number) => void
  onExportBackup: () => void
  onImportBackup: (file: File) => void
}

export function ContractsDashboard({
  contracts,
  onNewContract,
  onOpenContract,
  onQuickSign,
  onDuplicate,
  onDelete,
  onExportBackup,
  onImportBackup,
}: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending' | 'draft'>('all')

  const q = search.trim().toLowerCase()
  const filtered = contracts.filter((c) => {
    const matchesSearch =
      !q ||
      c.numero.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.data.auteurNom || '').toLowerCase().includes(q) ||
      (c.data.auteurInstagram || '').toLowerCase().includes(q)

    if (!matchesSearch) return false

    if (filter === 'signed') return c.status === 'signed'
    if (filter === 'pending') return c.status === 'pending_photographer'
    if (filter === 'draft') return c.status === 'draft'
    return true
  })

  return (
    <div className="dashboard-container">
      {/* HEADER DASHBOARD */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1 className="dashboard-hero-title">Mes Contrats de Cession</h1>
          <p className="dashboard-hero-sub">
            Gérez vos autorisations de diffusion et cessions de droits photographiques simplement et en toute conformité.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-large btn-new-contract"
          onClick={onNewContract}
        >
          <span className="material-symbols-rounded icon-sm">add</span>
          <span>Nouveau contrat</span>
        </button>
      </div>

      {/* BARRE D'OUTILS ET RECHERCHE */}
      <div className="dashboard-toolbar">
        <div className="dashboard-search-wrap">
          <span className="material-symbols-rounded dashboard-search-icon icon-sm">search</span>
          <input
            type="search"
            placeholder="Rechercher un photographe, @compte ou n°..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dashboard-search-input"
          />
        </div>

        <div className="dashboard-filters">
          <button
            type="button"
            className={`dashboard-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({contracts.length})
          </button>
          <button
            type="button"
            className={`dashboard-filter-pill ${filter === 'signed' ? 'active' : ''}`}
            onClick={() => setFilter('signed')}
          >
            Signés ({contracts.filter((c) => c.status === 'signed').length})
          </button>
          <button
            type="button"
            className={`dashboard-filter-pill ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            En attente ({contracts.filter((c) => c.status === 'pending_photographer').length})
          </button>
          <button
            type="button"
            className={`dashboard-filter-pill ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Brouillons ({contracts.filter((c) => c.status === 'draft').length})
          </button>
        </div>

        <div className="spacer" />

        <div className="dashboard-extra-actions">
          <button
            type="button"
            className="btn btn-small btn-ghost"
            onClick={onExportBackup}
            title="Télécharger une copie de sauvegarde JSON de tous vos contrats"
          >
            <span className="material-symbols-rounded icon-sm">save</span>
            <span>Sauvegarder</span>
          </button>
          <label className="btn btn-small btn-ghost" title="Restaurer une sauvegarde JSON">
            <span className="material-symbols-rounded icon-sm">restore</span>
            <span>Restaurer</span>
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const MAX_BACKUP_SIZE = 10 * 1024 * 1024 // 10 Mo
                  if (file.size > MAX_BACKUP_SIZE) {
                    alert('Fichier de sauvegarde trop volumineux (maximum 10 Mo).')
                    e.target.value = ''
                    return
                  }
                  onImportBackup(file)
                  e.target.value = ''
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* LISTE DES CONTRATS */}
      {filtered.length === 0 ? (
        <div className="dashboard-empty-card">
          {q || filter !== 'all' ? (
            <>
              <div className="empty-icon-circle">
                <span className="material-symbols-rounded" style={{ fontSize: 32, color: 'var(--brand-main)' }}>
                  search_off
                </span>
              </div>
              <h2>Aucun contrat correspondant</h2>
              <p>
                {q
                  ? `Aucun résultat pour « ${search} ». Essayez avec d'autres termes.`
                  : 'Aucun contrat dans cette catégorie de filtre.'}
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSearch('')
                  setFilter('all')
                }}
                style={{ marginTop: 8 }}
              >
                Réinitialiser la recherche
              </button>
            </>
          ) : (
            <>
              <div className="empty-icon-circle">
                <span className="material-symbols-rounded" style={{ fontSize: 36, color: 'var(--brand-main)' }}>
                  note_add
                </span>
              </div>
              <h2>Aucun contrat créé pour le moment</h2>
              <p>
                Créez votre premier contrat de cession de droits d'auteur en quelques étapes simples.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNewContract}
                style={{ marginTop: 12 }}
              >
                <span className="material-symbols-rounded icon-sm">add</span>
                <span>Créer mon premier contrat</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="contracts-grid">
          {filtered.map((c) => {
            const photoCount = parsePhotoItems(c.data.annexeImage).length
            const isSigned = c.status === 'signed'
            const isPending = c.status === 'pending_photographer'

            return (
              <div key={c.id} className="contract-card" onClick={() => onOpenContract(c)}>
                <div className="contract-card-top">
                  <span className="contract-numero-badge">{c.numero || 'Brouillon'}</span>
                  {isSigned ? (
                    <span className="status-pill status-signed">
                      <span className="material-symbols-rounded icon-xs">check_circle</span> 100% Signé
                    </span>
                  ) : isPending ? (
                    <span className="status-pill status-pending">
                      <span className="material-symbols-rounded icon-xs">pending</span> 1/2 Signé
                    </span>
                  ) : (
                    <span className="status-pill status-draft">
                      <span className="material-symbols-rounded icon-xs">edit_note</span> Brouillon
                    </span>
                  )}
                </div>

                <div className="contract-card-body">
                  <h3 className="contract-card-title">{c.title}</h3>
                  <div className="contract-card-details">
                    <span className="contract-detail-item">
                      <span className="material-symbols-rounded icon-xs">calendar_today</span>
                      <span>{c.data.dateSignature ? formatDate(c.data.dateSignature) : 'Date non définie'}</span>
                    </span>
                    <span className="contract-detail-item">
                      <span className="material-symbols-rounded icon-xs">image</span>
                      <span>{photoCount} photo{photoCount > 1 ? 's' : ''}</span>
                    </span>
                    <span className="contract-detail-item">
                      <span className="material-symbols-rounded icon-xs">schedule</span>
                      <span>{c.data.dureeAnnees || '10'} ans</span>
                    </span>
                  </div>
                </div>

                <div className="contract-card-footer" onClick={(e) => e.stopPropagation()}>
                  {isSigned ? (
                    <button
                      type="button"
                      className="btn btn-small btn-primary"
                      onClick={() => onOpenContract(c)}
                    >
                      <span className="material-symbols-rounded icon-xs">verified</span>
                      <span>Consulter l'acte signé (2/2)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-small btn-primary"
                      onClick={() => onQuickSign(c)}
                    >
                      <span className="material-symbols-rounded icon-xs">draw</span>
                      <span>Signer</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={() => onDuplicate(c)}
                    title="Dupliquer ce contrat"
                  >
                    <span className="material-symbols-rounded icon-xs">content_copy</span>
                    <span>Dupliquer</span>
                  </button>

                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => {
                      if (confirm(`Supprimer définitivement le contrat ${c.numero} (${c.title}) ?`)) {
                        if (c.id) onDelete(c.id)
                      }
                    }}
                    title="Supprimer ce contrat"
                    aria-label="Supprimer ce contrat"
                  >
                    <span className="material-symbols-rounded icon-xs">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
