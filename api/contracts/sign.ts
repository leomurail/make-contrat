import { getRedisClient } from '../_lib/redis'
import {
  isValidSignatureDataUrl,
  isValidUuid,
  jsonResponse,
  readJsonBody,
  sanitizeContractRecord,
  SIGNED_CONTRACT_TTL_SECONDS,
  verifySameOriginMutation,
} from '../_lib/security'

export const config = {
  runtime: 'edge',
}

const MAX_SIGN_BODY_BYTES = 2 * 1024 * 1024 // 2 Mo max pour une signature

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const redis = getRedisClient()

  if (!redis) {
    return jsonResponse(
      { error: 'Base de données non disponible. Veuillez vérifier la connexion Upstash Redis.' },
      500,
    )
  }

  // --- GET : Consulter le contrat à signer ---
  if (request.method === 'GET') {
    const token = url.searchParams.get('token')
    if (!isValidUuid(token)) {
      return jsonResponse({ error: 'Jeton de signature manquant ou invalide.' }, 400)
    }

    try {
      const raw = await redis.get<string>(`contract:${token}`)
      if (!raw) {
        return jsonResponse(
          { error: 'Ce lien de signature est invalide, a expiré ou le contrat a été supprimé.' },
          404,
        )
      }

      const record = sanitizeContractRecord(raw)
      return jsonResponse({ success: true, contract: record }, 200)
    } catch (error) {
      console.error('[API /api/contracts/sign GET]', error)
      return jsonResponse({ error: 'Erreur lors de la lecture du contrat.' }, 500)
    }
  }

  // --- POST : Apposer la signature du photographe ---
  if (request.method === 'POST') {
    const csrfError = verifySameOriginMutation(request, true)
    if (csrfError) return csrfError

    const bodyResult = await readJsonBody<{
      token?: unknown
      auteurSignature?: unknown
      signerName?: unknown
      auteurLuApprouve?: unknown
    }>(request, MAX_SIGN_BODY_BYTES)

    if (!bodyResult.ok) {
      return bodyResult.response
    }

    try {
      const { token, auteurSignature, signerName, auteurLuApprouve } = bodyResult.data

      if (!isValidUuid(token)) {
        return jsonResponse({ error: 'Jeton de signature manquant ou invalide.' }, 400)
      }

      if (auteurLuApprouve !== true) {
        return jsonResponse({ error: 'L’acceptation de la mention « Lu et approuvé » est obligatoire.' }, 400)
      }

      if (!isValidSignatureDataUrl(auteurSignature)) {
        return jsonResponse({ error: 'Format ou taille de signature invalide.' }, 400)
      }

      const trimmedName = typeof signerName === 'string' ? signerName.trim() : ''
      if (trimmedName.length < 2 || trimmedName.length > 150) {
        return jsonResponse({ error: 'Le prénom et nom du signataire sont obligatoires.' }, 400)
      }

      const raw = await redis.get<string>(`contract:${token}`)
      if (!raw) {
        return jsonResponse({ error: 'Ce contrat n’existe plus ou a expiré.' }, 404)
      }

      const record = sanitizeContractRecord(raw)

      if (record.status === 'signed') {
        return jsonResponse(
          {
            error: 'Ce contrat a déjà été signé et validé.',
            contract: record,
          },
          400,
        )
      }

      const now = new Date()
      const todayString = now.toISOString().split('T')[0]

      // Mise à jour minimale sans collecte d'IP ni User-Agent (principe de minimisation RGPD)
      record.status = 'signed'
      record.data = {
        ...record.data,
        auteurSignature,
        auteurLuApprouve: 'true',
        dateSignature: record.data.dateSignature || todayString,
        auteurNom: trimmedName,
      }
      record.photographeSignedAt = now.toISOString()
      record.expiresAt = new Date(now.getTime() + SIGNED_CONTRACT_TTL_SECONDS * 1000).toISOString()

      // Conservation réduite à 48h après signature pour laisser le temps de synchroniser et télécharger le PDF
      await redis.set(`contract:${token}`, JSON.stringify(record), {
        ex: SIGNED_CONTRACT_TTL_SECONDS,
      })

      return jsonResponse({ success: true, contract: record }, 200)
    } catch (error) {
      console.error('[API /api/contracts/sign POST]', error)
      return jsonResponse({ error: 'Erreur lors de la signature.' }, 500)
    }
  }

  return jsonResponse({ error: 'Méthode non autorisée.' }, 405)
}
