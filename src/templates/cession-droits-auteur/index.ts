import { serializeSocialAccounts, slugify, todayIso } from '../../lib/format'
import type { DocTemplate } from '../../lib/types'
import { ContratCession } from './ContratCession'
import { generateContratCessionDocx } from './docx'
import type { ContratCessionData } from './types'

export type { ContratCessionData }

export const SUPPORTS_OPTIONS = [
  'Site internet et réseaux sociaux',
  'Site internet uniquement',
  'Réseaux sociaux uniquement',
] as const

export const REMUNERATION_OPTIONS = [
  'À titre gracieux (gratuit)',
  'Rémunération forfaitaire',
] as const

export const DROIT_IMAGE_OPTIONS = [
  'Garantie accordée (autorisations détenues)',
  'Non applicable (paysages et biens sans personnes identifiables)',
] as const

const usesWebsite = (d: Record<string, string>) =>
  !d.supportsAutorises || d.supportsAutorises.toLowerCase().includes('site internet')

const usesSocials = (d: Record<string, string>) =>
  !d.supportsAutorises || d.supportsAutorises.toLowerCase().includes('réseaux sociaux')

const isPaid = (d: Record<string, string>) =>
  Boolean(d.remunerationType && d.remunerationType.toLowerCase().includes('forfait'))

export const contratCession: DocTemplate<ContratCessionData> = {
  id: 'cession-droits-auteur',
  name: "Cession de droits d'auteur",
  description: "Contrat simplifié de cession de droits d'auteur sur photographies (Site web & Réseaux sociaux)",
  fileName: (d) =>
    `contrat-cession-droits-${slugify(d.numero || 'brouillon')}-${slugify(d.auteurNom || 'photographe')}.pdf`,
  Document: ContratCession,
  generateDocx: generateContratCessionDocx,
  numbering: { field: 'numero', dateField: 'dateSignature' },
  labelField: 'auteurNom',
  detail: (d) => d.cessionnaireDenomination || d.cessionnaireRepresentant || 'Stéphanie JONAS EI',
  defaults: () => ({
    numero: '',
    dateSignature: todayIso(),
    villeSignature: 'Saint-Jean-de-Monts',

    // Photographe : vide par défaut
    auteurNom: '',
    auteurInstagram: '',
    auteurEmail: '',
    auteurAdresse: '',
    auteurSignature: '',
    auteurLuApprouve: '',

    // Bénéficiaire : pré-rempli avec les données SIRENE (Stéphanie JONAS EI - 103 726 881 00016)
    cessionnaireDenomination: 'Évasion Littorale',
    cessionnaireRepresentant: 'Stéphanie JONAS EI',
    cessionnaireAdresse: '136 Route de la Caillauderie, 85160 Saint-Jean-de-Monts', // Renseignez ici votre adresse par défaut (ou via Mode Expert > Bénéficiaire)
    cessionnaireRcs: '103 726 881 00016',
    cessionnaireEmail: 'evasionlittorale@gmail.com',
    cessionnaireSignature: '',
    cessionnaireLuApprouve: '',

    // Exploitation & Conditions
    supportsAutorises: SUPPORTS_OPTIONS[0],
    siteUrlPrincipale: 'https://evasionlittorale.com',
    reseauxSociauxCessionnaire: serializeSocialAccounts([
      {
        platform: 'Instagram',
        handle: 'evasionlittorale',
        url: 'https://www.instagram.com/evasionlittorale',
      },
      {
        platform: 'Facebook',
        handle: 'Évasion Littorale',
        url: 'https://www.facebook.com/profile.php?id=61594089339082',
      },
    ]),
    dureeAnnees: '10',
    remunerationType: REMUNERATION_OPTIONS[0],
    remunerationMontant: '',
    garantieDroitImage: DROIT_IMAGE_OPTIONS[0],

    // Photos cédées
    annexePublications: '',
    annexeImage: '',
  }),
  groups: [
    {
      title: 'Le Photographe (Cédant)',
      shortTitle: 'Photographe',
      description: 'Identité, adresse postale et compte Instagram de l’auteur des photos',
      fields: [
        {
          key: 'auteurNom',
          label: 'Nom et prénom',
          type: 'text',
          placeholder: 'Ex : Jean Martin',
          hint: 'Nom et prénom d’état civil de la personne qui a pris les photos',
        },
        {
          key: 'auteurAdresse',
          label: 'Adresse postale',
          type: 'text',
          placeholder: 'Ex : 12 rue des Pins, 85160 Saint-Jean-de-Monts',
          hint: 'Nécessaire pour identifier légalement le signataire (ou à compléter par lui sur le contrat)',
        },
        {
          key: 'auteurEmail',
          label: 'Adresse e-mail',
          type: 'text',
          placeholder: 'Ex : jean.martin@email.com',
        },
        {
          key: 'auteurInstagram',
          label: 'Compte Instagram',
          type: 'text',
          prefix: '@',
          placeholder: 'jean_photos',
          hint: 'Génère automatiquement le lien du profil et la mention de crédit photo obligatoire',
        },
      ],
    },
    {
      title: 'Le Bénéficiaire (Votre structure)',
      shortTitle: 'Bénéficiaire',
      description: 'Identité juridique, SIRET et adresse du bénéficiaire des droits',
      fields: [
        {
          key: 'cessionnaireDenomination',
          label: 'Nom commercial / Enseigne (optionnel)',
          type: 'text',
          placeholder: 'Évasion Littorale (laisser vide si sans enseigne)',
        },
        {
          key: 'cessionnaireRepresentant',
          label: 'Titulaire légal',
          type: 'text',
          placeholder: 'Stéphanie JONAS EI',
        },
        {
          key: 'cessionnaireAdresse',
          label: 'Adresse de l’établissement',
          type: 'text',
          placeholder: 'Ex : 12 rue des Dunes, 85160 Saint-Jean-de-Monts',
        },
        {
          key: 'cessionnaireRcs',
          label: 'Numéro SIRET',
          type: 'text',
          placeholder: '103 726 881 00016',
        },
        {
          key: 'cessionnaireEmail',
          label: 'Adresse e-mail de contact',
          type: 'text',
          placeholder: 'evasionlittorale@gmail.com',
        },
      ],
    },
    {
      title: 'Supports & Conditions',
      shortTitle: 'Conditions',
      description: 'Canaux de diffusion, durée légale de cession et droit à l’image',
      fields: [
        {
          key: 'supportsAutorises',
          label: 'Supports d’exploitation autorisés',
          type: 'select',
          options: [...SUPPORTS_OPTIONS],
          hint: 'Définit légalement où vous avez le droit de publier les images',
        },
        {
          key: 'siteUrlPrincipale',
          label: 'URL du site internet',
          type: 'text',
          placeholder: 'https://evasionlittorale.com',
          showIf: usesWebsite,
        },
        {
          key: 'reseauxSociauxCessionnaire',
          label: 'Vos comptes réseaux sociaux (optionnel)',
          type: 'socials',
          hint: 'Saisissez simplement votre @identifiant : le lien complet du compte sera ajouté automatiquement au contrat.',
          showIf: usesSocials,
        },
        {
          key: 'dureeAnnees',
          label: 'Durée d’autorisation',
          type: 'number',
          step: 1,
          min: 1,
          suffix: 'ans',
          placeholder: '10',
          presets: [
            { label: '5 ans', value: '5' },
            { label: '10 ans (Recommandé)', value: '10' },
            { label: '15 ans', value: '15' },
            { label: '30 ans', value: '30' },
            { label: '99 ans (Durée max légale)', value: '99' },
          ],
          hint: 'En droit français, la durée ne peut pas être « illimitée », mais peut aller de 10 à 99 ans.',
        },
        {
          key: 'remunerationType',
          label: 'Contrepartie financière',
          type: 'select',
          options: [...REMUNERATION_OPTIONS],
        },
        {
          key: 'remunerationMontant',
          label: 'Montant du forfait convenu',
          type: 'text',
          placeholder: 'Ex : 150 € TTC',
          showIf: isPaid,
        },
        {
          key: 'garantieDroitImage',
          label: 'Personnes identifiables sur les photos (Droit à l’image)',
          type: 'radio-cards',
          options: [
            {
              value: DROIT_IMAGE_OPTIONS[0],
              title: 'Garantie par le photographe (recommandé par défaut)',
              description:
                'Si des personnes sont reconnaissables, le photographe certifie avoir leur accord et en assume seul la responsabilité juridique.',
            },
            {
              value: DROIT_IMAGE_OPTIONS[1],
              title: 'Aucune personne identifiable sur les clichés',
              description:
                'Photos de paysages, plages, logements, nature ou silhouettes non reconnaissables.',
            },
          ],
        },
      ],
    },
    {
      title: 'Photographies cédées',
      shortTitle: 'Photos',
      description: 'Sélection et légendes des photographies ou captures Instagram annexées au contrat',
      fields: [
        {
          key: 'annexePublications',
          label: 'Photographies ou captures d’écran Instagram concernées',
          type: 'photos',
        },
      ],
    },
  ],
}
