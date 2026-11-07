import { getRedisClient, CONTRACT_TTL_SECONDS } from '../_lib/redis'
import type { RemoteContractRecord } from '../_lib/types'

export const config = {
  runtime: 'edge',
}

const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5 Mo max

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, private',
      },
    })
  }

  // Protection anti-CSRF / Sec-Fetch-Site
  const secFetchSite = request.headers.get('sec-fetch-site')
  if (secFetchSite && secFetchSite === 'cross-site') {
    return new Response(JSON.stringify({ error: 'Requête cross-origin non autorisée.' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, private',
      },
    })
  }

  // Vérification de la taille de la charge entrante
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Contenu trop volumineux (limite 5 Mo).' }), {
      status: 413,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, private',
      },
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
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      },
    )
  }

  try {
    const body = await request.json()
    const { contractNumero, data } = body

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Données du contrat manquantes ou invalides.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      },
    )
  } catch (error) {
    console.error('[API /api/contracts/share]', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la génération du lien.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      },
    )
  }
}
