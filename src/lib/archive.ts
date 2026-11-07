import { db, type Asset, type Counter, type StoredDocument } from './db'
import type { DocData, DocTemplate } from './types'

const ASSET_PREFIX = 'asset:'

/** Numéro complet : année de la date d'émission + numéro saisi sur 3 chiffres (2026, 1 -> "2026-001"). */
export const formatNumber = (year: string, seq: number) => `${year}-${String(seq).padStart(3, '0')}`

export function yearOf(isoDate: string | undefined): string {
  return isoDate && /^\d{4}/.test(isoDate) ? isoDate.slice(0, 4) : String(new Date().getFullYear())
}

/** Valide le numéro saisi : entier positif ("007" -> 7), ou null s'il est vide ou invalide. */
export function parseSeq(value: string | undefined): number | null {
  const v = (value ?? '').trim()
  return /^\d+$/.test(v) && Number(v) >= 1 ? Number(v) : null
}

/** Plus grand numéro déjà émis pour ce modèle cette année-là (0 s'il n'y en a pas), affiché comme repère. */
export async function lastNumber(templateId: string, year: string): Promise<number> {
  const [docs, contracts] = await Promise.all([
    db.documents.where('templateId').equals(templateId).toArray().catch(() => []),
    db.contracts.where('templateId').equals(templateId).toArray().catch(() => []),
  ])

  let maxNum = 0
  for (const d of docs) {
    if (d.numero.startsWith(`${year}-`)) {
      maxNum = Math.max(maxNum, Number(d.numero.slice(year.length + 1)) || 0)
    }
  }
  for (const c of contracts) {
    if (c.numero && c.numero.startsWith(`${year}-`)) {
      maxNum = Math.max(maxNum, Number(c.numero.slice(year.length + 1)) || 0)
    }
  }
  return maxNum
}

function imageKeys(template: DocTemplate): string[] {
  return [
    ...new Set([
      ...template.groups
        .flatMap((g) => g.fields)
        .filter((f) => f.type === 'image' || f.type === 'signature')
        .map((f) => f.key),
      'annexeImage',
      'cessionnaireSignature',
      'auteurSignature',
    ]),
  ]
}

async function storeSingleAsset(src: string, assets: Asset[]): Promise<string> {
  if (!src) return ''
  const dataUrl = await toDataUrl(src)
  const hash = await sha256(dataUrl)
  assets.push({ hash, dataUrl })
  return ASSET_PREFIX + hash
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  const blob = await (await fetch(src)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Émet un document avec le numéro saisi (préfixé par l'année) et l'enregistre dans l'historique.
 * Aucune restriction : un même numéro peut être émis plusieurs fois.
 */
export async function issueDocument(template: DocTemplate, draft: DocData): Promise<StoredDocument> {
  const { numbering } = template
  const data = { ...draft }
  const seq = parseSeq(data[numbering.field])
  if (seq === null) throw new Error('indique un numéro (nombre entier positif).')
  const numero = formatNumber(yearOf(data[numbering.dateField]), seq)
  data[numbering.field] = numero

  // Les images sont intégrées à l'archive (et pas référencées par URL) pour qu'un ancien
  // document reste reproductible même si le logo du modèle change. Préparé hors transaction :
  // IndexedDB valide une transaction dès qu'on attend une promesse qui ne vient pas de Dexie.
  const assets: Asset[] = []
  for (const key of imageKeys(template)) {
    const val = data[key]
    if (!val) continue
    if (val.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(val)
        if (Array.isArray(arr)) {
          const refs: unknown[] = []
          for (const item of arr) {
            if (typeof item === 'string' && item) {
              refs.push(await storeSingleAsset(item, assets))
            } else if (item && typeof item === 'object' && typeof item.src === 'string' && item.src) {
              refs.push({ ...item, src: await storeSingleAsset(item.src, assets) })
            }
          }
          data[key] = JSON.stringify(refs)
          continue
        }
      } catch {
        // fallback single
      }
    }
    data[key] = await storeSingleAsset(val, assets)
  }

  return db.transaction('rw', db.documents, db.assets, async () => {
    const doc: Omit<StoredDocument, 'id'> = {
      templateId: template.id,
      numero,
      label: data[template.labelField] ?? '',
      detail: template.detail(data),
      issuedOn: data[numbering.dateField] ?? '',
      createdAt: new Date().toISOString(),
      data,
    }
    await db.assets.bulkPut(assets)
    const id = await db.documents.add(doc as StoredDocument)
    return { ...doc, id }
  })
}

/** Remplace les références "asset:" par les images pour pouvoir re-générer le PDF. */
export async function resolveData(data: DocData): Promise<DocData> {
  const out = { ...data }
  for (const [key, value] of Object.entries(out)) {
    if (value.startsWith(ASSET_PREFIX)) {
      out[key] = (await db.assets.get(value.slice(ASSET_PREFIX.length)))?.dataUrl ?? ''
    } else if (value.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(value)
        if (Array.isArray(arr)) {
          const resolved: unknown[] = []
          for (const item of arr) {
            if (typeof item === 'string' && item.startsWith(ASSET_PREFIX)) {
              const url = (await db.assets.get(item.slice(ASSET_PREFIX.length)))?.dataUrl
              if (url) resolved.push(url)
            } else if (
              item &&
              typeof item === 'object' &&
              typeof item.src === 'string' &&
              item.src.startsWith(ASSET_PREFIX)
            ) {
              const url = (await db.assets.get(item.src.slice(ASSET_PREFIX.length)))?.dataUrl
              if (url) resolved.push({ ...item, src: url })
            } else {
              resolved.push(item)
            }
          }
          out[key] = JSON.stringify(resolved)
        }
      } catch {
        // ignore
      }
    }
  }
  return out
}

// --- Sauvegarde ---------------------------------------------------------------

interface Backup {
  app: 'make-contrat' | 'make-doc'
  version: 1 | 2
  exportedAt: string
  documents: StoredDocument[]
  contracts?: any[]
  counters: Counter[]
  assets: Asset[]
}

export async function exportBackup(): Promise<Blob> {
  const backup: Backup = {
    app: 'make-contrat',
    version: 2,
    exportedAt: new Date().toISOString(),
    documents: await db.documents.toArray(),
    contracts: await db.contracts.toArray(),
    counters: await db.counters.toArray(),
    assets: await db.assets.toArray(),
  }
  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
}

/** Fusionne une sauvegarde dans la base. Tout ou rien : en cas d'erreur, rien n'est modifié. */
export async function importBackup(file: File): Promise<number> {
  let backup: Backup
  try {
    backup = JSON.parse(await file.text())
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.")
  }
  if ((backup?.app !== 'make-contrat' && backup?.app !== 'make-doc') || !Array.isArray(backup.documents)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Make Contrat.")
  }

  await db.transaction('rw', db.documents, db.contracts, db.counters, db.assets, async () => {
    await db.assets.bulkPut(backup.assets ?? [])
    await db.documents.bulkPut(backup.documents)
    if (Array.isArray(backup.contracts) && backup.contracts.length > 0) {
      await db.contracts.bulkPut(backup.contracts)
    }
    // Un compteur ne recule jamais : on garde le plus grand des deux.
    for (const c of backup.counters ?? []) {
      const current = (await db.counters.get(c.key))?.value ?? 0
      await db.counters.put({ key: c.key, value: Math.max(current, c.value) })
    }
  })
  return (backup.contracts?.length ?? 0) + backup.documents.length
}
