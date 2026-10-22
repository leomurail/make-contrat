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
  const docs = await db.documents.where('templateId').equals(templateId).toArray()
  return docs
    .filter((d) => d.numero.startsWith(`${year}-`))
    .reduce((max, d) => Math.max(max, Number(d.numero.slice(year.length + 1)) || 0), 0)
}

function imageKeys(template: DocTemplate): string[] {
  return template.groups.flatMap((g) => g.fields).filter((f) => f.type === 'image').map((f) => f.key)
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
    if (!data[key]) continue
    const dataUrl = await toDataUrl(data[key])
    const hash = await sha256(dataUrl)
    assets.push({ hash, dataUrl })
    data[key] = ASSET_PREFIX + hash
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
    }
  }
  return out
}

// --- Sauvegarde ---------------------------------------------------------------

interface Backup {
  app: 'make-contrat' | 'make-doc'
  version: 1
  exportedAt: string
  documents: StoredDocument[]
  counters: Counter[]
  assets: Asset[]
}

export async function exportBackup(): Promise<Blob> {
  const backup: Backup = {
    app: 'make-contrat',
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: await db.documents.toArray(),
    counters: await db.counters.toArray(),
    assets: await db.assets.toArray(),
  }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

/** Fusionne une sauvegarde dans la base. Tout ou rien : en cas d'erreur, rien n'est modifié. */
export async function importBackup(file: File): Promise<number> {
  let backup: Backup
  try {
    backup = JSON.parse(await file.text())
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.")
  }
  if ((backup?.app !== 'make-contrat' && backup?.app !== 'make-doc') || backup.version !== 1 || !Array.isArray(backup.documents)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Make Contrat.")
  }

  await db.transaction('rw', db.documents, db.counters, db.assets, async () => {
    await db.assets.bulkPut(backup.assets ?? [])
    await db.documents.bulkPut(backup.documents)
    // Un compteur ne recule jamais : on garde le plus grand des deux.
    for (const c of backup.counters ?? []) {
      const current = (await db.counters.get(c.key))?.value ?? 0
      await db.counters.put({ key: c.key, value: Math.max(current, c.value) })
    }
  })
  return backup.documents.length
}
