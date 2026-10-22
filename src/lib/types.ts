import type { ComponentType } from 'react'

/** Toutes les valeurs du formulaire sont stockées en chaînes (les images en data URL). */
export type DocData = Record<string, string>

export type Field =
  | { key: string; label: string; type: 'text'; placeholder?: string; readOnly?: boolean; hint?: string }
  | { key: string; label: string; type: 'date'; hint?: string }
  | { key: string; label: string; type: 'textarea'; rows?: number; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'number'; step?: number; min?: number; suffix?: string; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'select'; options: string[]; hint?: string }
  | { key: string; label: string; type: 'image'; hint?: string }

export interface FieldGroup {
  title: string
  fields: Field[]
}

export interface DocTemplate<T extends DocData = DocData> {
  id: string
  name: string
  description: string
  groups: FieldGroup[]
  /** Valeurs initiales (appelé à chaque réinitialisation, pour avoir la date du jour). */
  defaults: () => T
  /** Composant @react-pdf/renderer : la racine doit être un <Document>. */
  Document: ComponentType<{ data: T }>
  fileName: (data: T) => string
  /** Champ du numéro (saisi à la main), et date remise à aujourd'hui quand on duplique un document. */
  numbering: { field: keyof T & string; dateField: keyof T & string }
  /** Champ affiché dans l'historique et proposé en suggestion (ex : nom du patient). */
  labelField: keyof T & string
  /** Info secondaire de l'historique (ex : montant). */
  detail: (data: T) => string
}
