import type { RemoteContractRecord } from './types'

export const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, private',
}

export const SIGNED_CONTRACT_TTL_SECONDS = 48 * 60 * 60 // 48 heures après signature

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SAFE_KEY_RE = /^[a-zA-Z0-9_]{1,64}$/
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: COMMON_HEADERS,
  })
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_RE.test(value)
}

export function isValidSignatureDataUrl(value: unknown, maxChars = 1_500_000): value is string {
  return typeof value === 'string' && value.length <= maxChars && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value)
}

/**
 * Vérifie que la requête mutante provient bien de la même origine :
 * - bloque Sec-Fetch-Site: cross-site
 * - si Origin est présent, vérifie l'égalité stricte avec Host
 * - pour POST, impose Content-Type: application/json pour éviter les requêtes simples sans preflight
 */
export function verifySameOriginMutation(request: Request, requireJsonContentType = true): Response | null {
  const secFetchSite = request.headers.get('sec-fetch-site')
  if (secFetchSite && secFetchSite === 'cross-site') {
    return jsonResponse({ error: 'Requête cross-origin non autorisée.' }, 403)
  }

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const originUrl = new URL(origin)
      const requestUrl = new URL(request.url)
      if (originUrl.host !== requestUrl.host) {
        return jsonResponse({ error: 'Origine de requête non autorisée.' }, 403)
      }
    } catch {
      return jsonResponse({ error: 'En-tête Origin invalide.' }, 403)
    }
  }

  if (requireJsonContentType && request.method === 'POST') {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return jsonResponse({ error: 'Content-Type application/json requis.' }, 415)
    }
  }

  return null
}

/**
 * Lit et parse un corps JSON en appliquant une limite de taille réelle sur les octets reçus
 * (indépendamment d'un en-tête Content-Length absent ou falsifié).
 */
export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number.parseInt(contentLength, 10) > maxBytes) {
    return { ok: false, response: jsonResponse({ error: 'Contenu trop volumineux.' }, 413) }
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return { ok: false, response: jsonResponse({ error: 'Impossible de lire le corps de la requête.' }, 400) }
  }

  if (new TextEncoder().encode(rawText).byteLength > maxBytes) {
    return { ok: false, response: jsonResponse({ error: 'Contenu trop volumineux.' }, 413) }
  }

  try {
    const parsed = JSON.parse(rawText)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, response: jsonResponse({ error: 'Corps JSON invalide.' }, 400) }
    }
    return { ok: true, data: parsed as T }
  } catch {
    return { ok: false, response: jsonResponse({ error: 'JSON mal formé.' }, 400) }
  }
}

/** Valide la structure plate Record<string, string> des données de contrat envoyées vers Redis. */
export function validateContractData(data: unknown): data is Record<string, string> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const entries = Object.entries(data as Record<string, unknown>)
  if (entries.length === 0 || entries.length > 60) return false

  for (const [key, val] of entries) {
    if (!SAFE_KEY_RE.test(key) || FORBIDDEN_KEYS.has(key)) return false
    if (typeof val !== 'string') return false
    if (val.startsWith('data:') && !IMAGE_DATA_URL_RE.test(val)) return false
  }
  return true
}

/** Nettoie un enregistrement lu depuis Redis pour ne jamais exposer de métadonnées superflues. */
export function sanitizeContractRecord(raw: unknown): RemoteContractRecord {
  const rec = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>
  return {
    token: String(rec.token ?? ''),
    contractNumero: String(rec.contractNumero ?? ''),
    status: (rec.status as RemoteContractRecord['status']) ?? 'pending_photographer',
    createdAt: String(rec.createdAt ?? ''),
    expiresAt: String(rec.expiresAt ?? ''),
    data: (rec.data && typeof rec.data === 'object' ? rec.data : {}) as Record<string, string>,
    ...(rec.beneficiaireSignedAt ? { beneficiaireSignedAt: String(rec.beneficiaireSignedAt) } : {}),
    ...(rec.photographeSignedAt ? { photographeSignedAt: String(rec.photographeSignedAt) } : {}),
  }
}
