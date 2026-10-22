import type { DocData } from '../../lib/types'

export interface ContratCessionData extends DocData {
  // Document & Références
  numero: string
  dateSignature: string
  villeSignature: string
  nombreExemplaires: string

  // Auteur (Le Cédant)
  auteurNom: string
  auteurInstagram: string
  auteurAdresse: string
  auteurStatut: string
  auteurSiret: string
  auteurTelephone: string
  auteurEmail: string
  auteurSignature: string

  // Cessionnaire
  cessionnaireDenomination: string
  cessionnaireForme: string
  cessionnaireCapital: string
  cessionnaireAdresse: string
  cessionnaireRcs: string
  cessionnaireRepresentant: string
  cessionnaireTelephone: string
  cessionnaireEmail: string
  cessionnaireSignature: string

  // Périmètre & Exploitation
  siteUrlPrincipale: string
  siteUrlSecondaire: string
  dureeAnnees: string
  dureeLettres: string
  remunerationType: string
  remunerationMontant: string
  garantieDroitImage: string

  // Annexe 1
  annexePublications: string
  annexeImage: string
}
