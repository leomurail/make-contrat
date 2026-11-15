import { getRedisClient } from '../_lib/redis'
import { isValidUuid, jsonResponse, sanitizeContractRecord } from '../_lib/security'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405)
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!isValidUuid(token)) {
    return jsonResponse({ error: 'Jeton manquant ou invalide.' }, 400)
  }

  const redis = getRedisClient()
  if (!redis) {
    return jsonResponse({ error: 'Base de données non configurée.' }, 500)
  }

  try {
    const raw = await redis.get<string>(`contract:${token}`)
    if (!raw) {
      return jsonResponse({ status: 'not_found' }, 404)
    }

    const record = sanitizeContractRecord(raw)
    return jsonResponse(
      {
        status: record.status,
        contractNumero: record.contractNumero,
        ...(record.status === 'signed' ? { contract: record } : {}),
      },
      200,
    )
  } catch (error) {
    console.error('[API /api/contracts/status]', error)
    return jsonResponse({ error: 'Erreur lors de la récupération du statut.' }, 500)
  }
}
