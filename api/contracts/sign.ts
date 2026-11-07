import { getRedisClient, CONTRACT_TTL_SECONDS } from '../_lib/redis'
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
  const redis = getRedisClient()

  if (!redis) {
    return new Response(
      JSON.stringify({
        error: 'Base de données non disponible. Veuillez vérifier la connexion Upstash Redis.',
      }),
      { status: 500, headers: COMMON_HEADERS },
    )
  }

  // --- GET : Consulter le contrat à signer ---
  if (request.method === 'GET') {
    const token = url.searchParams.get('token')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Jeton de signature manquant.' }), {
        status: 400,
        headers: COMMON_HEADERS,
      })
    }

    try {
      const raw = await redis.get<string>(`contract:${token}`)
      if (!raw) {
        return new Response(
          JSON.stringify({
            error:
              'Ce lien de signature est invalide, a expiré ou le contrat a été supprimé.',
          }),
          { status: 404, headers: COMMON_HEADERS },
        )
      }

      const record: RemoteContractRecord = typeof raw === 'string' ? JSON.parse(raw) : raw
      return new Response(JSON.stringify({ success: true, contract: record }), {
        status: 200,
        headers: COMMON_HEADERS,
      })
    } catch (error) {
      console.error('[API /api/contracts/sign GET]', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la lecture du contrat.' }),
        { status: 500, headers: COMMON_HEADERS },
      )
    }
  }

  // --- POST : Apposer la signature du photographe ---
  if (request.method === 'POST') {
    // Protection anti-CSRF
    const secFetchSite = request.headers.get('sec-fetch-site')
    if (secFetchSite && secFetchSite === 'cross-site') {
      return new Response(JSON.stringify({ error: 'Requête non autorisée.' }), {
        status: 403,
        headers: COMMON_HEADERS,
      })
    }

    try {
      const body = await request.json()
      const { token, auteurSignature, signerName } = body

      if (!token || !auteurSignature) {
        return new Response(
          JSON.stringify({ error: 'Jeton et signature obligatoires.' }),
          { status: 400, headers: COMMON_HEADERS },
        )
      }

      const raw = await redis.get<string>(`contract:${token}`)
      if (!raw) {
        return new Response(
          JSON.stringify({ error: 'Ce contrat n’existe plus ou a expiré.' }),
          { status: 404, headers: COMMON_HEADERS },
        )
      }

      const record: RemoteContractRecord = typeof raw === 'string' ? JSON.parse(raw) : raw

      if (record.status === 'signed') {
        return new Response(
          JSON.stringify({
            error: 'Ce contrat a déjà été signé et validé.',
            contract: record,
          }),
          { status: 400, headers: COMMON_HEADERS },
        )
      }

      const now = new Date()
      const todayString = now.toISOString().split('T')[0]

      // Mise à jour des données du contrat avec la signature de l'auteur
      record.status = 'signed'
      record.data = {
        ...record.data,
        auteurSignature,
        dateSignature: record.data.dateSignature || todayString,
        auteurNom: signerName || record.data.auteurNom,
      }
      record.photographeSignedAt = now.toISOString()
      record.photographeIp = request.headers.get('x-forwarded-for') || 'inconnu'
      record.photographeUserAgent = request.headers.get('user-agent') || 'inconnu'

      // Sauvegarde dans Redis avec conservation du TTL
      await redis.set(`contract:${token}`, JSON.stringify(record), {
        ex: CONTRACT_TTL_SECONDS,
      })

      return new Response(JSON.stringify({ success: true, contract: record }), {
        status: 200,
        headers: COMMON_HEADERS,
      })
    } catch (error) {
      console.error('[API /api/contracts/sign POST]', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la signature.' }),
        { status: 500, headers: COMMON_HEADERS },
      )
    }
  }

  return new Response(JSON.stringify({ error: 'Méthode non autorisée.' }), {
    status: 405,
    headers: COMMON_HEADERS,
  })
}
