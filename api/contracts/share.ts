import { getRedisClient, CONTRACT_TTL_SECONDS } from '../_lib/redis'
import type { RemoteContractRecord } from '../_lib/types'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const redis = getRedisClient()
  if (!redis) {
    return new Response(
      JSON.stringify({
        error:
          'Base de données non configurée. Veuillez connecter Upstash Redis dans le tableau de bord Vercel (Storage > Upstash).',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const body = await request.json()
    const { contractNumero, data } = body

    if (!data) {
      return new Response(JSON.stringify({ error: 'Données du contrat manquantes.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CONTRACT_TTL_SECONDS * 1000).toISOString()

    const record: RemoteContractRecord = {
      token,
      contractNumero: contractNumero || data.numero || 'SANS_NUMERO',
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

    return new Response(
      JSON.stringify({
        success: true,
        token,
        contractNumero: record.contractNumero,
        expiresAt,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erreur lors de la génération du lien : ${(error as Error).message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
