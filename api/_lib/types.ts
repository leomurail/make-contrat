export interface RemoteContractRecord {
  token: string
  contractNumero: string
  status: 'pending_photographer' | 'signed' | 'expired'
  createdAt: string
  expiresAt: string
  data: Record<string, any>
  beneficiaireSignedAt?: string
  photographeSignedAt?: string
  photographeIp?: string
  photographeUserAgent?: string
}
