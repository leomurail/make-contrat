/** Helpers partagés entre les rendus PDF et DOCX du contrat de cession. */

export function parseSupportFlags(supports: string | undefined): { useSite: boolean; useSocial: boolean } {
  const norm = (supports || '').toLowerCase()
  if (!norm) return { useSite: true, useSocial: true }
  return {
    useSite: norm.includes('site'),
    useSocial: norm.includes('réseaux') || norm.includes('reseaux'),
  }
}

export function cleanSiret(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/^siret\s*:?\s*/i, '').trim()
}

export function extractInitials(name?: string, fallback = '…'): string {
  if (!name || !name.trim()) return fallback
  const cleaned = name
    .replace(/\b(EI|EIRL|SARL|SAS|SASU|EURL|SA|SCI)\b/gi, '')
    .replace(/[^a-zA-ZÀ-ÿ\s-]/g, '')
    .trim()
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  if (words.length === 0) return fallback
  if (words.length === 1) {
    const w = words[0]
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0].toUpperCase()}.`
  }
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('')
}

/** Formate le nom du bénéficiaire pour le bloc signature / en-têtes sans forcer une enseigne vide. */
export function formatBeneficiaryName(
  denomination: string | undefined,
  representant: string | undefined,
  fallback = '…………………………………………',
): string {
  const denom = denomination?.trim()
  const rep = representant?.trim()
  if (denom && rep) return `${denom} — ${rep}`
  if (rep) return rep
  if (denom) return denom
  return fallback
}
