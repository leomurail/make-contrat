import { getRedisClient } from '../_lib/redis'
import type { RemoteContractRecord } from '../_lib/types'

export const config = {
  runtime: 'edge',
}

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
}

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(JSON.stringify({ error: 'Jeton manquant.' }), {
      status: 400,
      headers: COMMON_HEADERS,
    })
  }

  const redis = getRedisClient()
  if (!redis) {
    return new Response(
      JSON.stringify({ error: 'Base de données non configurée.' }),
      { status: 500, headers: COMMON_HEADERS },
    )
  }

  try {
    const raw = await redis.get<string>(`contract:${token}`)
    if (!raw) {
      return new Response(JSON.stringify({ status: 'not_found' }), {
        status: 404,
        headers: COMMON_HEADERS,
      })
    }

    const record: RemoteContractRecord = typeof raw === 'string' ? JSON.parse(raw) : raw
    return new Response(
      JSON.stringify({
        status: record.status,
        contractNumero: record.contractNumero,
        contract: record,
      }),
      { status: 200, headers: COMMON_HEADERS },
    )
  } catch (error) {
    console.error('[API /api/contracts/status]', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la récupération du statut.' }),
      { status: 500, headers: COMMON_HEADERS },
    )
  }
}
