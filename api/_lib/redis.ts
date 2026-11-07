import { Redis } from '@upstash/redis'

/**
 * Initialise le client Redis Upstash.
 * Supporte automatiquement les deux conventions de nommage des variables Vercel :
 * - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (intégration Marketplace)
 * - KV_REST_API_URL / KV_REST_API_TOKEN (intégration historique Vercel KV)
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({
    url,
    token,
  })
}

export const CONTRACT_TTL_SECONDS = 14 * 24 * 60 * 60 // 14 jours
