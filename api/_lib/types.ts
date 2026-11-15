export interface RemoteContractRecord {
  token: string
  contractNumero: string
  status: 'pending_photographer' | 'signed' | 'expired'
  createdAt: string
  expiresAt: string
  data: Record<string, string>
  beneficiaireSignedAt?: string
  photographeSignedAt?: string
}
