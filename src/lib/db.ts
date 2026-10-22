import Dexie, { type EntityTable } from 'dexie'
import type { DocData } from './types'

/** Un document émis : figé, numéroté, conservé dans l'historique. */
export interface StoredDocument {
  id: number
  templateId: string
  numero: string
  /** Libellé affiché dans l'historique (ex : nom du patient), indexé pour les suggestions. */
  label: string
  /** Info secondaire affichée dans l'historique (ex : montant). */
  detail: string
  /** Date d'émission (AAAA-MM-JJ). */
  issuedOn: string
  /** Horodatage de l'enregistrement. */
  createdAt: string
  /** Valeurs du formulaire ; les images y sont remplacées par "asset:<sha256>". */
  data: DocData
}

/** Ancienne numérotation automatique (clé "note-honoraires:2026") : plus utilisée, gardée pour relire les anciennes sauvegardes. */
export interface Counter {
  key: string
  value: number
}

/** Images dédupliquées : un logo utilisé sur 1000 notes n'est stocké qu'une fois. */
export interface Asset {
  hash: string
  dataUrl: string
}

export const db = new Dexie('make-contrat') as Dexie & {
  documents: EntityTable<StoredDocument, 'id'>
  counters: EntityTable<Counter, 'key'>
  assets: EntityTable<Asset, 'hash'>
}

db.version(1).stores({
  documents: '++id, templateId, &[templateId+numero], label, createdAt',
  counters: 'key',
  assets: 'hash',
})

// v2 : le numéro n'est plus unique (le même numéro peut être émis plusieurs fois).
db.version(2).stores({
  documents: '++id, templateId, [templateId+numero], label, createdAt',
})
