import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../lib/archive'
import { db, type StoredDocument } from '../lib/db'
import { saveBlob } from '../lib/download'
import { formatDate, todayIso } from '../lib/format'
import type { DocTemplate } from '../lib/types'

const LAST_BACKUP_KEY = 'make-contrat:last-backup'

interface Props {
  templates: DocTemplate[]
  onDownload: (doc: StoredDocument) => Promise<void>
  onDownloadDocx?: (doc: StoredDocument) => Promise<void>
  onDuplicate: (doc: StoredDocument) => Promise<void>
}

export function History({ templates, onDownload, onDownloadDocx, onDuplicate }: Props) {
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [lastBackup, setLastBackup] = useState(() => readLastBackup())
  const fileInput = useRef<HTMLInputElement>(null)

  const docs = useLiveQuery(() => db.documents.orderBy('createdAt').reverse().toArray().catch(() => []), [])
  const names = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  const q = query.trim().toLowerCase()
  const filtered = (docs ?? []).filter(
    (d) => !q || d.numero.toLowerCase().includes(q) || d.label.toLowerCase().includes(q),
  )

  const run = async (id: number, action: () => Promise<void>) => {
    setBusyId(id)
    try {
      await action()
    } catch (e) {
      setMessage({ text: String((e as Error).message ?? e), error: true })
    } finally {
      setBusyId(null)
    }
  }

  const backup = async () => {
    saveBlob(await exportBackup(), `make-contrat-sauvegarde-${todayIso()}.json`)
    const now = new Date().toISOString()
    try {
      localStorage.setItem(LAST_BACKUP_KEY, now)
    } catch {
      /* ignore */
    }
    setLastBackup(now)
    setMessage({ text: 'Sauvegarde téléchargée. Range-la hors de cet ordinateur (clé USB, cloud…).' })
  }

  const MAX_BACKUP_SIZE = 10 * 1024 * 1024 // 10 Mo

  const restore = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BACKUP_SIZE) {
      setMessage({ text: 'Fichier de sauvegarde trop volumineux (maximum 10 Mo).', error: true })
      return
    }
    try {
      const count = await importBackup(file)
      setMessage({ text: `Sauvegarde restaurée : ${count} document(s).` })
    } catch (e) {
      setMessage({ text: `Restauration impossible : ${(e as Error).message}`, error: true })
    }
  }

  return (
    <div className="history">
      <div className="history-bar">
        <input
          type="search"
          placeholder="Rechercher un auteur, signataire ou numéro…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher"
        />
        <div className="spacer" />
        <span className="muted small">
          {lastBackup ? `Dernière sauvegarde : ${new Date(lastBackup).toLocaleDateString('fr-FR')}` : 'Jamais sauvegardé'}
        </span>
        <button type="button" className="btn" onClick={backup}>
          Sauvegarder
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
          Restaurer…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            restore(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {message ? <p className={message.error ? 'notice error' : 'notice'}>{message.text}</p> : null}

      {docs === undefined ? null : docs.length === 0 ? (
        <p className="empty">Aucun contrat émis pour l'instant. Ils apparaîtront ici après « Émettre ».</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Auteur / Cédant</th>
              <th>Détail / Cessionnaire</th>
              <th>Modèle</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.numero}</td>
                <td>{formatDate(d.issuedOn)}</td>
                <td>{d.label}</td>
                <td className="num">{d.detail}</td>
                <td className="muted">{names[d.templateId] ?? d.templateId}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn btn-small"
                    disabled={busyId === d.id}
                    onClick={() => run(d.id, () => onDownload(d))}
                  >
                    PDF
                  </button>
                  {onDownloadDocx ? (
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={busyId === d.id}
                      onClick={() => run(d.id, () => onDownloadDocx(d))}
                      style={{ marginLeft: 6 }}
                    >
                      Word (.docx)
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    disabled={busyId === d.id}
                    onClick={() => run(d.id, () => onDuplicate(d))}
                    style={{ marginLeft: 4 }}
                  >
                    Dupliquer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function readLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}
