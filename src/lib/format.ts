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

const FRENCH_NUMBERS: Record<number, string> = {
  1: 'un',
  2: 'deux',
  3: 'trois',
  4: 'quatre',
  5: 'cinq',
  6: 'six',
  7: 'sept',
  8: 'huit',
  9: 'neuf',
  10: 'dix',
  12: 'douze',
  15: 'quinze',
  20: 'vingt',
  25: 'vingt-cinq',
  30: 'trente',
  50: 'cinquante',
  70: 'soixante-dix',
  99: 'quatre-vingt-dix-neuf',
}

/** Convertit un nombre d'années en toutes lettres (ex: "10" -> "dix"). */
export function yearsToWords(value: string | number | undefined): string {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return FRENCH_NUMBERS[n] ?? String(n)
}

export interface SocialAccount {
  platform: string
  handle: string
  url: string
}

export const SOCIAL_PLATFORMS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'Pinterest',
  'LinkedIn',
  'YouTube',
  'Autre',
] as const

export function parseSocialAccounts(raw: string | undefined): SocialAccount[] {
  if (!raw || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x.platform === 'string')
        .map((x) => {
          let handle = typeof x.handle === 'string' ? x.handle : ''
          let url = typeof x.url === 'string' ? x.url : ''
          // Rétrocompatibilité : si l'URL était stockée dans handle
          if (/^https?:\/\//i.test(handle) && !url) {
            url = handle
            handle = ''
            if (x.platform === 'Instagram') {
              const m = /(?:instagram\.com\/)([a-zA-Z0-9._]+)/i.exec(url)
              if (m) handle = m[1]
            }
          }
          return {
            platform: x.platform,
            handle,
            url,
          }
        })
    }
  } catch {
    // Fallback texte ancien format
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ platform: 'Instagram', handle: s, url: '' }))
}

export function serializeSocialAccounts(accounts: SocialAccount[]): string {
  return JSON.stringify(accounts)
}

/** Formate un compte réseau social avec son pseudo et son URL complète pour le contrat. */
export function formatSocialAccountLegal(acc: SocialAccount): string {
  const handleRaw = (acc.handle || '').trim()
  const urlRaw = (acc.url || '').trim()

  let cleanHandle = handleRaw.replace(/^@+/, '').trim()
  let cleanUrl = urlRaw

  // Rétrocompatibilité : si l'ancien handle contenait une URL
  if (/^https?:\/\//i.test(handleRaw) && !cleanUrl) {
    cleanUrl = handleRaw
    cleanHandle = ''
  }

  // Déduction automatique du pseudo si vide et URL Instagram
  if (acc.platform === 'Instagram' && cleanUrl && !cleanHandle) {
    const m = /(?:instagram\.com\/)([a-zA-Z0-9._]+)/i.exec(cleanUrl)
    if (m) cleanHandle = m[1]
  }

  // Déduction automatique de l'URL si vide et pseudo fourni
  if (!cleanUrl && cleanHandle) {
    switch (acc.platform) {
      case 'Instagram':
        cleanUrl = `https://www.instagram.com/${cleanHandle}`
        break
      case 'Facebook':
        cleanUrl = `https://www.facebook.com/${cleanHandle}`
        break
      case 'TikTok':
        cleanUrl = `https://www.tiktok.com/@${cleanHandle}`
        break
      case 'Pinterest':
        cleanUrl = `https://www.pinterest.com/${cleanHandle}`
        break
      case 'YouTube':
        cleanUrl = `https://www.youtube.com/@${cleanHandle}`
        break
    }
  }

  const cleanUrlDisplay = cleanUrl ? cleanUrl.replace(/\/+$/, '') : ''

  if (cleanHandle && cleanUrlDisplay) {
    const handleDisplay =
      (acc.platform === 'Instagram' || acc.platform === 'TikTok') && !cleanHandle.startsWith('@')
        ? `@${cleanHandle}`
        : cleanHandle
    return `${acc.platform} (${handleDisplay} – ${cleanUrlDisplay})`
  }

  if (cleanUrlDisplay) {
    return `${acc.platform} (${cleanUrlDisplay})`
  }

  if (cleanHandle) {
    const handleDisplay =
      (acc.platform === 'Instagram' || acc.platform === 'TikTok') && !cleanHandle.startsWith('@')
        ? `@${cleanHandle}`
        : cleanHandle
    return `${acc.platform} (${handleDisplay})`
  }

  return ''
}

export function formatAllSocialAccounts(raw: string | undefined): string {
  const accounts = parseSocialAccounts(raw)
    .map(formatSocialAccountLegal)
    .filter(Boolean)
  return accounts.join(', ')
}

export interface PhotoItem {
  src: string
  label: string
}

/** Nettoie un nom de fichier pour en faire un intitulé propre (ou garde un libellé générique si c'est un nom de capture brute). */
export function cleanFileNameToLabel(fileName: string, index: number): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, '').trim()
  const isGeneric =
    /^(img|dsc|photo|image|screenshot|capture|screen|whatsapp|insta|pxl|gop|dji)[_\-\s\d]*$/i.test(withoutExt) ||
    /^capture d’écran/i.test(withoutExt) ||
    /^capture d'écran/i.test(withoutExt) ||
    withoutExt.length < 3

  if (isGeneric) {
    return `Photographie n°${index}`
  }
  const readable = withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return readable.charAt(0).toUpperCase() + readable.slice(1)
}

export function parsePhotoItems(raw: string | undefined): PhotoItem[] {
  if (!raw || !raw.trim()) return []
  const trimmed = raw.trim()
  if (trimmed.startsWith('data:image/')) {
    return [{ src: trimmed, label: 'Photographie n°1' }]
  }
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, idx): PhotoItem | null => {
          if (typeof item === 'string' && item.startsWith('data:image/')) {
            return { src: item, label: `Photographie n°${idx + 1}` }
          }
          if (item && typeof item === 'object' && typeof item.src === 'string' && item.src.startsWith('data:image/')) {
            return {
              src: item.src,
              label: typeof item.label === 'string' && item.label.trim() ? item.label : `Photographie n°${idx + 1}`,
            }
          }
          return null
        })
        .filter((x): x is PhotoItem => x !== null)
    }
  } catch {
    // ignore
  }
  return []
}

export function serializePhotoItems(items: PhotoItem[]): string {
  return items.length > 0 ? JSON.stringify(items) : ''
}


