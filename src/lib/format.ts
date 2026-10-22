/** "2026-10-04" -> "04/10/2026" (laisse la valeur telle quelle si ce n'est pas une date ISO). */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value
}

export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseAmount(value: string | undefined): number {
  const n = Number.parseFloat((value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function formatAmount(value: string | number): string {
  const n = typeof value === 'number' ? value : parseAmount(value)
  return `${n.toFixed(2)} €`
}

/** Nom de fichier sûr : sans accents ni caractères spéciaux. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
