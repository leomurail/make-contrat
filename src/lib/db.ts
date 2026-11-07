import Dexie, { type EntityTable } from 'dexie'
import type { DocData } from './types'

/** Un document émis : figé, numéroté, conservé dans l'historique (compatibilité legacy). */
export interface StoredDocument {
  id: number
  templateId: string
  numero: string
  label: string
  detail: string
  issuedOn: string
  createdAt: string
  data: DocData
}

export type ContractStatus = 'draft' | 'pending_photographer' | 'signed'

/** Un contrat géré comme projet modifiable, duplicable et signable */
export interface ContractItem {
  id?: number
  templateId: string
  numero: string
  title: string
  status: ContractStatus
  data: DocData
  createdAt: string
  updatedAt: string
  shareToken?: string
  shareExpiresAt?: string
}

export interface Counter {
  key: string
  value: number
}

export interface Asset {
  hash: string
  dataUrl: string
}

export const db = new Dexie('make-contrat') as Dexie & {
  documents: EntityTable<StoredDocument, 'id'>
  contracts: EntityTable<ContractItem, 'id'>
  counters: EntityTable<Counter, 'key'>
  assets: EntityTable<Asset, 'hash'>
}

db.version(1).stores({
  documents: '++id, templateId, &[templateId+numero], label, createdAt',
  counters: 'key',
  assets: 'hash',
})

db.version(2).stores({
  documents: '++id, templateId, [templateId+numero], label, createdAt',
})

// v3 : Gestion complète des projets de contrats
db.version(3).stores({
  documents: '++id, templateId, [templateId+numero], label, createdAt',
  contracts: '++id, templateId, numero, status, createdAt, updatedAt',
})
