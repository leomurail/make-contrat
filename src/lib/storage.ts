import type { DocData } from './types'

const key = (templateId: string) => `make-contrat:v9:${templateId}`

export function loadData<T extends DocData>(templateId: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key(templateId))
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Record<string, string>
    const merged: Record<string, string> = { ...defaults }
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== '' || !(k in defaults) || defaults[k] === '') {
        merged[k] = v
      }
    }
    return merged as T
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
