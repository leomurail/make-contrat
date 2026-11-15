import { getRedisClient, CONTRACT_TTL_SECONDS } from '../_lib/redis'
import {
  isValidUuid,
  jsonResponse,
  readJsonBody,
  validateContractData,
  verifySameOriginMutation,
} from '../_lib/security'
import type { RemoteContractRecord } from '../_lib/types'

export const config = {
  runtime: 'edge',
}

const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5 Mo max

export default async function handler(request: Request) {
  const method = request.method
  if (method !== 'POST' && method !== 'DELETE') {
    return jsonResponse({ error: 'Méthode non autorisée. Utilisez POST ou DELETE.' }, 405)
  }

  const csrfError = verifySameOriginMutation(request, method === 'POST')
  if (csrfError) return csrfError

  const redis = getRedisClient()
  if (!redis) {
    return jsonResponse(
      {
        error:
          'Base de données non configurée. Veuillez connecter Upstash Redis dans le tableau de bord Vercel (Storage > Upstash).',
      },
      500,
    )
  }

  const url = new URL(request.url)

  // --- TRAITEMENT DU DELETE (Suppression du lien de signature distant) ---
  if (method === 'DELETE') {
    let token: unknown = url.searchParams.get('token')
    if (!token && request.headers.get('content-type')?.includes('application/json')) {
      const parsed = await readJsonBody<{ token?: unknown }>(request, 4096)
      if (parsed.ok) {
        token = parsed.data.token
      }
    }

    if (!isValidUuid(token)) {
      return jsonResponse({ error: 'Jeton de signature manquant ou invalide.' }, 400)
    }

    await redis.del(`contract:${token}`)
    return jsonResponse(
      {
        success: true,
        message: 'Lien de signature supprimé avec succès.',
      },
      200,
    )
  }

  // --- TRAITEMENT DU POST ---
  const bodyResult = await readJsonBody<{
    action?: unknown
    token?: unknown
    contractNumero?: unknown
    data?: unknown
  }>(request, MAX_BODY_BYTES)

  if (!bodyResult.ok) {
    return bodyResult.response
  }

  try {
    const body = bodyResult.data

    // Fallback de suppression via POST pour les proxies filtrant DELETE
    if (body.action === 'delete') {
      const token = body.token ?? url.searchParams.get('token')
      if (!isValidUuid(token)) {
        return jsonResponse({ error: 'Jeton de signature manquant ou invalide.' }, 400)
      }
      await redis.del(`contract:${token}`)
      return jsonResponse(
        {
          success: true,
          message: 'Lien de signature supprimé avec succès.',
        },
        200,
      )
    }

    const { contractNumero, data } = body

    if (!validateContractData(data)) {
      return jsonResponse({ error: 'Données du contrat manquantes ou invalides.' }, 400)
    }

    const numeroStr =
      typeof contractNumero === 'string' && contractNumero.trim()
        ? contractNumero.trim().slice(0, 64)
        : (data.numero || 'SANS_NUMERO').slice(0, 64)

    const token = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CONTRACT_TTL_SECONDS * 1000).toISOString()

    const record: RemoteContractRecord = {
      token,
      contractNumero: numeroStr,
      status: 'pending_photographer',
      createdAt: now.toISOString(),
      expiresAt,
      data,
      beneficiaireSignedAt: data.dateSignature || now.toISOString(),
    }

    // Sauvegarde avec expiration automatique (14 jours)
    await redis.set(`contract:${token}`, JSON.stringify(record), {
      ex: CONTRACT_TTL_SECONDS,
    })

    return jsonResponse(
      {
        success: true,
        token,
        contractNumero: record.contractNumero,
        expiresAt,
      },
      201,
    )
  } catch (error) {
    console.error('[API /api/contracts/share]', error)
    return jsonResponse({ error: 'Erreur lors de la génération du lien.' }, 500)
  }
}
