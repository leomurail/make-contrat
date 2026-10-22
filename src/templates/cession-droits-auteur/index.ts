import { slugify, todayIso } from '../../lib/format'
import type { DocTemplate } from '../../lib/types'
import { ContratCession } from './ContratCession'
import type { ContratCessionData } from './types'

export type { ContratCessionData }

export const contratCession: DocTemplate<ContratCessionData> = {
  id: 'cession-droits-auteur',
  name: "Cession de droits d'auteur",
  description: "Contrat de cession de droits d'auteur sur œuvres photographiques (Instagram / Web)",
  fileName: (d) =>
    `contrat-cession-droits-${slugify(d.numero || 'brouillon')}-${slugify(d.auteurNom || 'auteur')}.pdf`,
  Document: ContratCession,
  numbering: { field: 'numero', dateField: 'dateSignature' },
  labelField: 'auteurNom',
  detail: (d) => d.cessionnaireDenomination || 'Cessionnaire non spécifié',
  defaults: () => ({
    numero: '',
    dateSignature: todayIso(),
    villeSignature: 'Venansault',
    nombreExemplaires: '2',

    auteurNom: 'Camille Dupont',
    auteurInstagram: 'camille_shots',
    auteurAdresse: '12 rue des Alizés, 85000 La Roche-sur-Yon',
    auteurStatut: 'Particulier',
    auteurSiret: 'Sans objet',
    auteurTelephone: '06 12 34 56 78',
    auteurEmail: 'camille.dupont@email.com',
    auteurSignature: '',

    cessionnaireDenomination: 'Évasion Littorale',
    cessionnaireForme: 'Entreprise Individuelle (EI)',
    cessionnaireCapital: 'Sans objet',
    cessionnaireAdresse: '41 rue Pierre Nicolas Loué, 85190 Venansault',
    cessionnaireRcs: 'RCS La Roche-sur-Yon n° 109 409 045',
    cessionnaireRepresentant: 'Léo Murail, Fondateur',
    cessionnaireTelephone: '06 43 52 69 26',
    cessionnaireEmail: 'contact@evasionlittorale.com',
    cessionnaireSignature: '',

    siteUrlPrincipale: 'https://evasionlittorale.com',
    siteUrlSecondaire: 'https://evasionlittorale.leomurail.fr',
    dureeAnnees: '5',
    dureeLettres: 'cinq',
    remunerationType: 'À titre gracieux (gratuit)',
    remunerationMontant: 'Sans objet',
    garantieDroitImage: 'Garantie accordée (autorisations détenues)',

    annexePublications: [
      'Publication 1 : https://www.instagram.com/p/DB12345/ - Photographie du port au coucher du soleil',
      'Publication 2 : https://www.instagram.com/p/DC67890/ - Photographie de la côte rocheuse et des vagues',
      'Publication 3 : https://www.instagram.com/p/DD11223/ - Photographie aérienne du sentier littoral',
    ].join('\n'),
    annexeImage: '',
  }),
  groups: [
    {
      title: 'Contrat & Émission',
      fields: [
        {
          key: 'numero',
          label: 'Numéro du contrat',
          type: 'number',
          step: 1,
          min: 1,
          hint: 'Numéro séquentiel (ex : 1 donnera CTR-2026-001)',
        },
        { key: 'dateSignature', label: 'Date de signature', type: 'date' },
        { key: 'villeSignature', label: 'Lieu de signature (Fait à)', type: 'text', placeholder: 'Venansault' },
      ],
    },
    {
      title: 'L’Auteur (Le Cédant)',
      fields: [
        { key: 'auteurNom', label: 'Nom et prénom', type: 'text', placeholder: 'Camille Dupont' },
        {
          key: 'auteurInstagram',
          label: 'Compte Instagram',
          type: 'text',
          placeholder: 'camille_shots (sans le @)',
          hint: 'L’URL du profil et la mention de crédit seront générées automatiquement',
        },
        {
          key: 'auteurStatut',
          label: 'Statut',
          type: 'select',
          options: ['Particulier', 'Artiste-auteur', 'Indépendant / Freelance', 'Entreprise Individuelle'],
        },
        { key: 'auteurAdresse', label: 'Adresse de domicile', type: 'textarea', rows: 2 },
        { key: 'auteurSiret', label: 'N° SIRET ou n° d’ordre', type: 'text', placeholder: 'Sans objet' },
        { key: 'auteurTelephone', label: 'Téléphone', type: 'text', placeholder: '06 12 34 56 78' },
        { key: 'auteurEmail', label: 'Adresse e-mail', type: 'text', placeholder: 'camille.dupont@email.com' },
        { key: 'auteurSignature', label: 'Signature manuscrite du cédant', type: 'image' },
      ],
    },
    {
      title: 'Le Cessionnaire (Bénéficiaire)',
      fields: [
        { key: 'cessionnaireDenomination', label: 'Dénomination sociale', type: 'text', placeholder: 'Évasion Littorale' },
        {
          key: 'cessionnaireForme',
          label: 'Forme juridique',
          type: 'select',
          options: [
            'Entreprise Individuelle (EI)',
            'SAS',
            'SASU',
            'SARL',
            'EURL',
            'Association',
            'Société Civile',
          ],
        },
        { key: 'cessionnaireCapital', label: 'Capital social', type: 'text', placeholder: 'Sans objet ou 1 000 €' },
        { key: 'cessionnaireAdresse', label: 'Siège social', type: 'textarea', rows: 2 },
        {
          key: 'cessionnaireRcs',
          label: 'Immatriculation (RCS / SIREN)',
          type: 'text',
          placeholder: 'RCS La Roche-sur-Yon n° 109 409 045',
        },
        {
          key: 'cessionnaireRepresentant',
          label: 'Représenté par (Nom, prénom et fonction)',
          type: 'text',
          placeholder: 'Léo Murail, Fondateur',
        },
        { key: 'cessionnaireTelephone', label: 'Téléphone', type: 'text', placeholder: '06 43 52 69 26' },
        { key: 'cessionnaireEmail', label: 'Adresse e-mail', type: 'text', placeholder: 'contact@evasionlittorale.com' },
        { key: 'cessionnaireSignature', label: 'Signature / Cachet du cessionnaire', type: 'image' },
      ],
    },
    {
      title: 'Destination & Conditions d’exploitation',
      fields: [
        { key: 'siteUrlPrincipale', label: 'URL principale du site web', type: 'text', placeholder: 'https://evasionlittorale.com' },
        { key: 'siteUrlSecondaire', label: 'URL secondaire du site web', type: 'text', placeholder: 'https://evasionlittorale.leomurail.fr' },
        { key: 'dureeAnnees', label: 'Durée (en années)', type: 'number', step: 1, min: 1, suffix: 'ans' },
        { key: 'dureeLettres', label: 'Durée (en toutes lettres)', type: 'text', placeholder: 'cinq' },
        {
          key: 'remunerationType',
          label: 'Type de rémunération',
          type: 'select',
          options: ['À titre gracieux (gratuit)', 'Rémunération forfaitaire'],
        },
        {
          key: 'remunerationMontant',
          label: 'Montant forfaitaire (si applicable)',
          type: 'text',
          placeholder: 'Sans objet ou 250 € HT',
        },
        {
          key: 'garantieDroitImage',
          label: 'Droit à l’image',
          type: 'select',
          options: [
            'Garantie accordée (autorisations détenues)',
            'Non applicable (paysages et biens sans personnes identifiables)',
          ],
        },
      ],
    },
    {
      title: 'Annexe 1 – Œuvres Cédées',
      fields: [
        {
          key: 'annexePublications',
          label: 'Publications Instagram cédées (URL et descriptions)',
          type: 'textarea',
          rows: 6,
          placeholder: 'Publication 1 : URL - Description\nPublication 2 : URL - Description',
          hint: 'Une ligne par publication cédée',
        },
        {
          key: 'annexeImage',
          label: 'Capture d’écran horodatée du compte Instagram (optionnel)',
          type: 'image',
        },
      ],
    },
  ],
}
