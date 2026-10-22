import type { DocData } from './types'

const key = (templateId: string) => `make-doc:${templateId}`

export function loadData<T extends DocData>(templateId: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key(templateId))
    // Fusion avec les valeurs par défaut : un champ ajouté au template plus tard reste rempli.
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function saveData(templateId: string, data: DocData): void {
  try {
    localStorage.setItem(key(templateId), JSON.stringify(data))
  } catch {
    // Quota dépassé (grosse image) ou stockage bloqué : on continue sans persistance.
  }
}

export function clearData(templateId: string): void {
  try {
    localStorage.removeItem(key(templateId))
  } catch {
    // ignore
  }
}
