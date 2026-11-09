import { pdf } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useEffect, useRef } from 'react'
import { ContractsDashboard } from './components/ContractsDashboard'
import { StandardWorkflow } from './components/StandardWorkflow'
import { PublicSignPage } from './components/PublicSignPage'
import {
  createNewContract,
  deleteContract,
  duplicateContract,
  saveContract,
} from './lib/contracts'
import { exportBackup, importBackup, resolveData } from './lib/archive'
import { db, type ContractItem } from './lib/db'
import { saveBlob } from './lib/download'
import { todayIso } from './lib/format'
import { checkRemoteContractStatus } from './lib/remoteSigning'
import type { DocData, DocTemplate } from './lib/types'
import { templates } from './templates'

async function renderPdf(template: DocTemplate, data: DocData): Promise<void> {
  const Doc = template.Document
  const resolved = await resolveData(data)
  saveBlob(await pdf(<Doc data={resolved} />).toBlob(), template.fileName(resolved))
}

async function renderDocx(template: DocTemplate, data: DocData): Promise<void> {
  if (!template.generateDocx) throw new Error('Export Word non disponible pour ce modèle.')
  const resolved = await resolveData(data)
  const fileName = template.fileName(resolved).replace(/\.pdf$/i, '') + '.docx'
  saveBlob(await template.generateDocx(resolved), fileName)
}

export default function App() {
  // 1. Détection prioritaire du mode signature publique via l'URL (/signer?token=... ou ?token=...)
  const queryToken = new URLSearchParams(window.location.search).get('token')
  const pathToken = window.location.pathname.startsWith('/signer')
    ? new URLSearchParams(window.location.search).get('token')
    : null
  const publicToken = queryToken || pathToken

  if (publicToken) {
    return <PublicSignPage token={publicToken} />
  }

  const template = templates[0] // Modèle de cession de droits d'auteur
  const [activeContractId, setActiveContractId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

  // Requête réactive sur la liste des contrats triés par date décroissante
  const contracts = useLiveQuery(
    () => db.contracts.orderBy('updatedAt').reverse().toArray().catch(() => []),
    [],
  )

  const activeContract = contracts?.find((c) => c.id === activeContractId) ?? null

  // Synchronisation active en arrière-plan des contrats en attente de signature
  useEffect(() => {
    if (!contracts || contracts.length === 0) return

    const checkPendingContracts = async () => {
      const pendingWithToken = contracts.filter(
        (c) => c.status === 'pending_photographer' && c.shareToken,
      )
      if (pendingWithToken.length === 0) return

      for (const c of pendingWithToken) {
        if (!c.shareToken) continue
        try {
          const res = await checkRemoteContractStatus(c.shareToken)
          if (res.status === 'signed' && res.contract) {
            const updated: ContractItem = {
              ...c,
              status: 'signed',
              data: {
                ...c.data,
                auteurSignature: res.contract.data.auteurSignature,
                auteurLuApprouve: res.contract.data.auteurLuApprouve || 'true',
                dateSignature: res.contract.data.dateSignature || c.data.dateSignature,
                auteurNom: res.contract.data.auteurNom || c.data.auteurNom,
              },
            }
            await saveContract(updated)
            setNotice({
              text: `Le contrat ${c.numero} (${res.contract.data.auteurNom || 'Photographe'}) a été signé ! L’acte officiel est désormais 100% validé.`,
            })
          }
        } catch {
          // Contrat encore en attente ou problème réseau passager
        }
      }
    }

    // Vérification immédiate
    checkPendingContracts()

    // Polling toutes les 6 secondes pour détecter la signature en direct
    const interval = setInterval(checkPendingContracts, 6000)

    // Vérification supplémentaire quand l'utilisateur revient sur l'onglet
    const handleFocus = () => {
      checkPendingContracts()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [contracts])

  // File d'attente d'enregistrement séquentiel pour éliminer tout risque d'écrasement ou de race condition
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve())

  const updateContractField = (
    keyOrUpdates: string | Record<string, string>,
    maybeValue?: string,
  ) => {
    if (!activeContractId) return Promise.resolve()

    const updates: Record<string, string> =
      typeof keyOrUpdates === 'string'
        ? { [keyOrUpdates]: maybeValue ?? '' }
        : keyOrUpdates

    updateQueueRef.current = updateQueueRef.current
      .then(async () => {
        const current = await db.contracts.get(activeContractId)
        if (!current) return
        const updatedData = { ...current.data, ...updates }
        const updatedContract: ContractItem = {
          ...current,
          data: updatedData,
        }
        await saveContract(updatedContract)
      })
      .catch((err) => {
        console.error('Erreur lors de la sauvegarde du contrat :', err)
      })

    return updateQueueRef.current
  }

  const handleTokenCreated = async (token: string, expiresAt: string) => {
    if (!activeContractId) return
    const current = await db.contracts.get(activeContractId)
    if (!current) return
    const updated: ContractItem = {
      ...current,
      shareToken: token,
      shareExpiresAt: expiresAt,
      status: current.status === 'signed' ? 'signed' : 'pending_photographer',
    }
    await saveContract(updated)
    setNotice({ text: 'Lien de signature créé et prêt à être envoyé.' })
  }

  const handleNewContract = async () => {
    try {
      const created = await createNewContract(template)
      setActiveContractId(created.id ?? null)
      setNotice(null)
    } catch (e) {
      setNotice({ text: `Impossible de créer le contrat : ${(e as Error).message}`, error: true })
    }
  }

  const handleOpenContract = (c: ContractItem) => {
    if (c.id) {
      setActiveContractId(c.id)
      setNotice(null)
    }
  }

  const handleDuplicateContract = async (c: ContractItem) => {
    if (!c.id) return
    try {
      const copy = await duplicateContract(c.id, template)
      setNotice({ text: `Contrat dupliqué sous la référence ${copy.numero}.` })
    } catch (e) {
      setNotice({ text: `Erreur lors de la duplication : ${(e as Error).message}`, error: true })
    }
  }

  const handleDeleteContract = async (id: number) => {
    try {
      await deleteContract(id)
      if (activeContractId === id) {
        setActiveContractId(null)
      }
      setNotice({ text: 'Contrat supprimé avec succès.' })
    } catch (e) {
      setNotice({ text: `Erreur lors de la suppression : ${(e as Error).message}`, error: true })
    }
  }

  const handleExportBackup = async () => {
    try {
      saveBlob(await exportBackup(), `make-contrat-sauvegarde-${todayIso()}.json`)
      setNotice({ text: 'Sauvegarde de tous vos contrats téléchargée.' })
    } catch (e) {
      setNotice({ text: `Erreur sauvegarde : ${(e as Error).message}`, error: true })
    }
  }

  const handleImportBackup = async (file: File) => {
    try {
      const count = await importBackup(file)
      setNotice({ text: `Sauvegarde restaurée : ${count} élément(s).` })
    } catch (e) {
      setNotice({ text: `Erreur restauration : ${(e as Error).message}`, error: true })
    }
  }

  const handleDownloadPdf = async () => {
    if (!activeContract) return
    try {
      await renderPdf(template, activeContract.data)
      setNotice({ text: 'Contrat PDF téléchargé avec succès.' })
    } catch (e) {
      setNotice({ text: `Erreur téléchargement PDF : ${(e as Error).message}`, error: true })
    }
  }

  const handleDownloadDocx = async () => {
    if (!activeContract) return
    try {
      await renderDocx(template, activeContract.data)
      setNotice({ text: 'Contrat Word (.docx) téléchargé avec succès.' })
    } catch (e) {
      setNotice({ text: `Erreur téléchargement Word : ${(e as Error).message}`, error: true })
    }
  }

  return (
    <div className="app">
      {/* BARRE SUPÉRIEURE UNIQUE */}
      <header className="topbar">
        <div className="brand" onClick={() => setActiveContractId(null)} style={{ cursor: 'pointer' }}>
          <span className="brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <div className="brand-text-wrap">
            <span className="brand-title">Make Contrat</span>
            <span className="brand-sub">Évasion Littorale</span>
          </div>
        </div>

        <div className="spacer" />

        <div className="topbar-actions">
          {activeContract ? (
            <div className="topbar-contract-badge">
              <span className="badge-dot green" />
              <span>Contrat {activeContract.numero || 'en cours'}</span>
            </div>
          ) : null}
        </div>
      </header>

      {/* NOTIFICATIONS EN BANDEAU */}
      {notice ? (
        <div className="app-notice-bar">
          <p className={notice.error ? 'notice error' : 'notice'}>
            {notice.text}
            <button type="button" className="notice-dismiss" onClick={() => setNotice(null)} aria-label="Fermer">
              <span className="material-symbols-rounded icon-xs">close</span>
            </button>
          </p>
        </div>
      ) : null}

      {/* VUE PRINCIPALE : DASHBOARD OU PARCOURS DU CONTRAT */}
      <main className="app-main-content">
        {activeContract ? (
          <StandardWorkflow
            template={template}
            data={activeContract.data}
            onChange={updateContractField}
            onSaveAndBack={() => setActiveContractId(null)}
            onDownloadPdf={handleDownloadPdf}
            onDownloadDocx={handleDownloadDocx}
            contractNumero={activeContract.numero}
            shareToken={activeContract.shareToken}
            onTokenCreated={handleTokenCreated}
          />
        ) : (
          <ContractsDashboard
            contracts={contracts ?? []}
            onNewContract={handleNewContract}
            onOpenContract={handleOpenContract}
            onQuickSign={handleOpenContract}
            onDuplicate={handleDuplicateContract}
            onDelete={handleDeleteContract}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>
    </div>
  )
}
