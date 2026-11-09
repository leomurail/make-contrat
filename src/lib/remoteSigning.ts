import type { DocData } from './types'

export interface RemoteContractRecord {
  token: string
  contractNumero: string
  status: 'pending_photographer' | 'signed' | 'expired'
  createdAt: string
  expiresAt: string
  data: DocData
  beneficiaireSignedAt?: string
  photographeSignedAt?: string
  photographeIp?: string
  photographeUserAgent?: string
}

/**
 * Crée un lien de signature à distance en enregistrant le contrat dans la base en ligne.
 */
export async function createRemoteSignLink(
  contractNumero: string,
  data: DocData,
): Promise<{ token: string; url: string; expiresAt: string }> {
  const response = await fetch('/api/contracts/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractNumero, data }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erreur réseau.' }))
    throw new Error(errorData.error || 'Impossible de créer le lien de signature.')
  }

  const result = await response.json()
  const origin = window.location.origin
  const url = `${origin}/signer?token=${result.token}`

  return {
    token: result.token,
    url,
    expiresAt: result.expiresAt,
  }
}

/**
 * Récupère les données d'un contrat distant via son jeton de signature (utilisé par la page /signer).
 */
export async function fetchRemoteContract(token: string): Promise<RemoteContractRecord> {
  const response = await fetch(`/api/contracts/sign?token=${encodeURIComponent(token)}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erreur de chargement.' }))
    throw new Error(errorData.error || 'Lien de signature invalide ou expiré.')
  }

  const result = await response.json()
  return result.contract
}

/**
 * Soumet la signature du photographe pour finaliser le contrat.
 */
export async function submitRemoteSignature(
  token: string,
  auteurSignature: string,
  signerName?: string,
  auteurLuApprouve: boolean = true,
): Promise<RemoteContractRecord> {
  const response = await fetch('/api/contracts/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      auteurSignature,
      signerName,
      auteurLuApprouve,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la signature.' }))
    throw new Error(errorData.error || 'Impossible d’enregistrer la signature.')
  }

  const result = await response.json()
  return result.contract
}

/**
 * Vérifie le statut d'un contrat partagé (appelé par le dashboard pour synchroniser).
 */
export async function checkRemoteContractStatus(
  token: string,
): Promise<{ status: string; contract?: RemoteContractRecord }> {
  const response = await fetch(`/api/contracts/status?token=${encodeURIComponent(token)}`)

  if (!response.ok) {
    return { status: 'error' }
  }

  return response.json()
}

/**
 * Révoque et supprime définitivement un lien de signature distant dans la base en ligne.
 */
export async function revokeRemoteSignLink(token: string): Promise<boolean> {
  if (!token) return true
  try {
    const response = await fetch(`/api/contracts/share?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch (err) {
    console.warn('Impossible de révoquer le lien distant :', err)
    return false
  }
}
