import { db, type ContractItem, type ContractStatus } from './db'
import { formatNumber, lastNumber, yearOf } from './archive'
import type { DocData, DocTemplate } from './types'

const DEFAULT_BENEFICIAIRE_SIG_KEY = 'make-contrat:saved-beneficiaire-signature'

export function getSavedBeneficiaireSignature(): string {
  try {
    return localStorage.getItem(DEFAULT_BENEFICIAIRE_SIG_KEY) || ''
  } catch {
    return ''
  }
}

export function saveBeneficiaireSignature(sigDataUrl: string): void {
  try {
    if (sigDataUrl) {
      localStorage.setItem(DEFAULT_BENEFICIAIRE_SIG_KEY, sigDataUrl)
    } else {
      localStorage.removeItem(DEFAULT_BENEFICIAIRE_SIG_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export function computeContractStatus(data: DocData): ContractStatus {
  const hasCessionnaire = Boolean(data.cessionnaireSignature && data.cessionnaireSignature.trim() !== '')
  const hasAuteur = Boolean(data.auteurSignature && data.auteurSignature.trim() !== '')

  if (hasCessionnaire && hasAuteur) return 'signed'
  if (hasCessionnaire) return 'pending_photographer'
  return 'draft'
}

export function generateContractTitle(data: DocData): string {
  const auteur = (data.auteurNom || '').trim()
  const insta = (data.auteurInstagram || '').replace(/^@+/, '').trim()
  if (auteur && insta) return `${auteur} (@${insta})`
  if (auteur) return auteur
  if (insta) return `@${insta}`
  return 'Nouveau contrat sans nom'
}

export async function createNewContract(template: DocTemplate): Promise<ContractItem> {
  const defaults = template.defaults()
  const savedSig = getSavedBeneficiaireSignature()
  if (savedSig && !defaults.cessionnaireSignature) {
    defaults.cessionnaireSignature = savedSig
  }

  const { dateField } = template.numbering
  const year = yearOf(defaults[dateField])
  const last = await lastNumber(template.id, year).catch(() => 0)
  const nextSeq = last + 1
  const numero = formatNumber(year, nextSeq)

  const payload: DocData = {
    ...defaults,
    [template.numbering.field]: numero,
  }

  const now = new Date().toISOString()
  const contract: ContractItem = {
    templateId: template.id,
    numero,
    title: generateContractTitle(payload),
    status: computeContractStatus(payload),
    data: payload,
    createdAt: now,
    updatedAt: now,
  }

  const id = await db.contracts.add(contract)
  return { ...contract, id: Number(id) }
}

export async function saveContract(contract: ContractItem): Promise<void> {
  if (!contract.id) return
  const now = new Date().toISOString()
  const updatedStatus = computeContractStatus(contract.data)
  const updatedTitle = generateContractTitle(contract.data)

  await db.contracts.update(contract.id, {
    numero: contract.numero || contract.data[contract.templateId] || '',
    title: updatedTitle,
    status: updatedStatus,
    data: contract.data,
    updatedAt: now,
  })
}

export async function duplicateContract(sourceId: number, template: DocTemplate): Promise<ContractItem> {
  const original = await db.contracts.get(sourceId)
  if (!original) throw new Error('Contrat source introuvable.')

  const { dateField } = template.numbering
  const year = yearOf(original.data[dateField])
  const last = await lastNumber(template.id, year).catch(() => 0)
  const nextSeq = last + 1
  const nextNumero = formatNumber(year, nextSeq)

  const now = new Date().toISOString()
  const copyData: DocData = {
    ...original.data,
    [template.numbering.field]: nextNumero,
    auteurSignature: '', // Réinitialise la signature du photographe pour le nouveau contrat
  }

  const copy: ContractItem = {
    templateId: original.templateId,
    numero: nextNumero,
    title: `${generateContractTitle(copyData)} (Copie)`,
    status: computeContractStatus(copyData),
    data: copyData,
    createdAt: now,
    updatedAt: now,
  }

  const id = await db.contracts.add(copy)
  return { ...copy, id: Number(id) }
}

export async function deleteContract(id: number): Promise<void> {
  await db.contracts.delete(id)
}
