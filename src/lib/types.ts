import type { ComponentType } from 'react'

/** Toutes les valeurs du formulaire sont stockées en chaînes (les images en data URL). */
export type DocData = Record<string, string>

export interface RadioCardOption {
  value: string
  title: string
  description: string
}

interface BaseField {
  key: string
  label: string
  hint?: string
  /** Permet de n'afficher le champ que si la condition est remplie. */
  showIf?: (data: DocData) => boolean
}

export type Field =
  | (BaseField & { type: 'text'; placeholder?: string; prefix?: string; readOnly?: boolean })
  | (BaseField & { type: 'date' })
  | (BaseField & { type: 'textarea'; rows?: number; placeholder?: string })
  | (BaseField & {
      type: 'number'
      step?: number
      min?: number
      suffix?: string
      placeholder?: string
      presets?: { label: string; value: string }[]
    })
  | (BaseField & { type: 'select'; options: string[] })
  | (BaseField & { type: 'radio-cards'; options: RadioCardOption[] })
  | (BaseField & { type: 'socials' })
  | (BaseField & { type: 'photos' })
  | (BaseField & { type: 'image' })
  | (BaseField & { type: 'signature' })

export interface FieldGroup {
  title: string
  shortTitle?: string
  description?: string
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
  /** Générateur optionnel de fichier Word (.docx). */
  generateDocx?: (data: T) => Promise<Blob>
  fileName: (data: T) => string
  /** Champ du numéro (saisi ou auto), et date remise à aujourd'hui quand on duplique un document. */
  numbering: { field: keyof T & string; dateField: keyof T & string }
  /** Champ affiché dans l'historique et proposé en suggestion (ex : nom du photographe). */
  labelField: keyof T & string
  /** Info secondaire de l'historique. */
  detail: (data: T) => string
}
