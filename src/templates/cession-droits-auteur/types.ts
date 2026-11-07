import type { DocData } from '../../lib/types'

export interface ContratCessionData extends DocData {
  // Document & Références
  numero: string
  dateSignature: string
  villeSignature: string

  // Auteur (Le Photographe / Cédant)
  auteurNom: string
  auteurInstagram: string
  auteurEmail: string
  auteurAdresse: string
  auteurSignature: string

  // Cessionnaire (Le Bénéficiaire)
  cessionnaireDenomination: string
  cessionnaireRepresentant: string
  cessionnaireAdresse: string
  cessionnaireRcs: string
  cessionnaireEmail: string
  cessionnaireSignature: string

  // Périmètre & Exploitation
  supportsAutorises: string
  siteUrlPrincipale: string
  reseauxSociauxCessionnaire: string
  dureeAnnees: string
  remunerationType: string
  remunerationMontant: string
  garantieDroitImage: string

  // Œuvres cédées & Annexe
  annexePublications: string
  annexeImage: string
}
