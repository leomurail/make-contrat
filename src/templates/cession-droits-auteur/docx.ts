import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  WidthType,
} from 'docx'
import { formatAllSocialAccounts, formatDate, parsePhotoItems, yearsToWords } from '../../lib/format'
import type { ContratCessionData } from './types'

// A4 dimensions in DXA (210mm x 297mm) with ~22mm margins (1247 DXA)
const PAGE_WIDTH = 11906
const PAGE_HEIGHT = 16838
const MARGIN = 1247
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2 // 9412 DXA
const HALF_WIDTH = Math.floor(CONTENT_WIDTH / 2) // 4706 DXA

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

function parseSupportFlags(supports: string | undefined) {
  const norm = (supports || '').toLowerCase()
  if (!norm) return { useSite: true, useSocial: true }
  return {
    useSite: norm.includes('site'),
    useSocial: norm.includes('réseaux') || norm.includes('reseaux'),
  }
}

function cleanSiret(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/^siret\s*:?\s*/i, '').trim()
}

function dataUrlToImage(dataUrl: string | undefined): { bytes: Uint8Array; type: 'png' | 'jpg' } | null {
  if (!dataUrl) return null
  const m = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!m) return null
  try {
    const mimeSub = m[1].toLowerCase()
    const type: 'png' | 'jpg' = mimeSub.includes('png') ? 'png' : 'jpg'
    const bin = atob(m[2])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return { bytes, type }
  } catch {
    return null
  }
}

function articleHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 20, color: '000000' })],
  })
}

function bodyPara(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 110 },
    children: [new TextRun({ text, size: 20, color: '000000' })],
  })
}

function bulletPara(boldPrefix: string, text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: 'contract-bullets', level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 70 },
    children: [
      new TextRun({ text: boldPrefix, bold: true, size: 20 }),
      new TextRun({ text, size: 20 }),
    ],
  })
}

function extractInitials(name?: string, fallback = '…'): string {
  if (!name || !name.trim()) return fallback
  const cleaned = name
    .replace(/\b(EI|EIRL|SARL|SAS|SASU|EURL|SA|SCI)\b/gi, '')
    .replace(/[^a-zA-ZÀ-ÿ\s-]/g, '')
    .trim()
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  if (words.length === 0) return fallback
  if (words.length === 1) {
    const w = words[0]
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0].toUpperCase()}.`
  }
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('')
}

export async function generateContratCessionDocx(data: ContratCessionData): Promise<Blob> {
  const cleanInstagram = (data.auteurInstagram || '').replace(/^@+/, '').trim()
  const { useSite, useSocial } = parseSupportFlags(data.supportsAutorises)
  const formattedSocials = formatAllSocialAccounts(data.reseauxSociauxCessionnaire)
  const siretCessionnaire = cleanSiret(data.cessionnaireRcs)

  const isGracieux =
    !data.remunerationType ||
    data.remunerationType.toLowerCase().includes('gracieux') ||
    data.remunerationType.toLowerCase().includes('gratuit')

  const dateStr = formatDate(data.dateSignature) || data.dateSignature || '—'
  const hasValidNum = Boolean(data.numero && data.numero.trim() !== '' && data.numero !== '…')
  const numContrat = hasValidNum
    ? data.numero.startsWith('CTR-')
      ? data.numero
      : `CTR-${data.numero}`
    : 'Brouillon'

  const benefInitials = extractInitials(
    data.cessionnaireRepresentant || data.cessionnaireDenomination,
    'LJ',
  )
  const auteurInitials = extractInitials(data.auteurNom, 'Auteur')

  const dureeChiffres = (data.dureeAnnees || '10').trim()
  const dureeMots = yearsToWords(dureeChiffres)

  const photoItems = parsePhotoItems(data.annexeImage)
  const publicationsList = (data.annexePublications || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const creditText = cleanInstagram
    ? `© ${data.auteurNom || "Nom de l'Auteur"} (@${cleanInstagram})`
    : `© ${data.auteurNom || "Nom de l'Auteur"}`

  const destinationSummary =
    useSite && useSocial
      ? 'sur son site internet et ses réseaux sociaux officiels'
      : useSite
        ? 'sur son site internet officiel'
        : 'sur ses réseaux sociaux officiels'

  const auteurSigImg = dataUrlToImage(data.auteurSignature)
  const cessionnaireSigImg = dataUrlToImage(data.cessionnaireSignature)

  const signaturesTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [HALF_WIDTH, CONTENT_WIDTH - HALF_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            margins: { top: 80, bottom: 80, left: 0, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: 'POUR L’AUTEUR (LE PHOTOGRAPHE)', bold: true, size: 19 })],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: `Nom : ${data.auteurNom?.trim() || '…………………………………………'}`, size: 19 })],
              }),
              new Paragraph({
                spacing: { after: 20 },
                children: [new TextRun({ text: 'Mention « Lu et approuvé, bon pour accord » :', bold: true, size: 18 })],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: 'Lu et approuvé, bon pour accord',
                    italics: true,
                    color: auteurSigImg ? '1e3a8a' : '64748b',
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: 'Signature :', bold: true, size: 18 })],
              }),
              ...(auteurSigImg
                ? [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          type: auteurSigImg.type,
                          data: auteurSigImg.bytes,
                          transformation: { width: 150, height: 50 },
                          altText: {
                            title: 'Signature Auteur',
                            description: 'Signature Auteur',
                            name: 'sig-auteur',
                          },
                        }),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      spacing: { after: 400 },
                      children: [new TextRun({ text: '…………………………………………', color: '64748b', size: 19 })],
                    }),
                  ]),
            ],
          }),
          new TableCell({
            width: { size: CONTENT_WIDTH - HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            margins: { top: 80, bottom: 80, left: 160, right: 0 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: 'POUR LE BÉNÉFICIAIRE', bold: true, size: 19 })],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `Nom : ${data.cessionnaireDenomination?.trim() || 'Évasion Littorale'}${data.cessionnaireRepresentant?.trim() ? ` — ${data.cessionnaireRepresentant.trim()}` : ''}`,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 20 },
                children: [new TextRun({ text: 'Mention « Lu et approuvé, bon pour accord » :', bold: true, size: 18 })],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: 'Lu et approuvé, bon pour accord',
                    italics: true,
                    color: cessionnaireSigImg ? '1e3a8a' : '64748b',
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: 'Signature :', bold: true, size: 18 })],
              }),
              ...(cessionnaireSigImg
                ? [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          type: cessionnaireSigImg.type,
                          data: cessionnaireSigImg.bytes,
                          transformation: { width: 150, height: 50 },
                          altText: {
                            title: 'Signature Bénéficiaire',
                            description: 'Signature Bénéficiaire',
                            name: 'sig-cessionnaire',
                          },
                        }),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      spacing: { after: 400 },
                      children: [new TextRun({ text: '…………………………………………', color: '64748b', size: 19 })],
                    }),
                  ]),
            ],
          }),
        ],
      }),
    ],
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 20, color: '000000' },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Arial', size: 24, bold: true, color: '000000' },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 40, after: 60 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Arial', size: 20, bold: true, color: '000000' },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'contract-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '-',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 180 } } },
            },
          ],
        },
        {
          reference: 'photos-numbers',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
                children: [
                  new TextRun({ text: 'Contrat de cession de droits photographiques', size: 16, color: '555555' }),
                  new TextRun({ text: `\tRéf. ${numContrat}`, size: 16, color: '555555' }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  { type: TabStopType.CENTER, position: 4800 },
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
                children: [
                  new TextRun({
                    text: `Réf. ${numContrat}`,
                    size: 15,
                    color: '555555',
                  }),
                  new TextRun({
                    text: `\tParaphes : [ Bénéficiaire : ${benefInitials} ]  [ Auteur : ${auteurInitials} ]`,
                    size: 15,
                    color: '1e3a8a',
                    bold: true,
                  }),
                  new TextRun({ text: '\tPage ', size: 15, color: '555555' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '555555' }),
                  new TextRun({ text: ' / ', size: 15, color: '555555' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: '555555' }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'CONTRAT D’AUTORISATION ET DE CESSION DE DROITS PHOTOGRAPHIQUES',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 8 } },
            children: [
              new TextRun({
                text: 'Soumis aux dispositions des articles L. 111-1, L. 121-1 et L. 131-1 à L. 131-4 du Code de la propriété intellectuelle',
                italics: true,
                size: 18,
                color: '333333',
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 120, after: 100 },
            children: [new TextRun({ text: 'ENTRE LES SOUSSIGNÉS :', bold: true, size: 20 })],
          }),

          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: '1° Le Photographe (L’Auteur) :', bold: true, size: 20 })],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'Nom et prénom : ', bold: true, size: 20 }),
              new TextRun({ text: data.auteurNom?.trim() || '………………………………………………………………', size: 20 }),
            ],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'Adresse postale : ', bold: true, size: 20 }),
              new TextRun({ text: data.auteurAdresse?.trim() || '………………………………………………………………', size: 20 }),
            ],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'Adresse e-mail : ', bold: true, size: 20 }),
              new TextRun({ text: data.auteurEmail?.trim() || '………………………………………………………………', size: 20 }),
            ],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'Compte Instagram : ', bold: true, size: 20 }),
              new TextRun({
                text: cleanInstagram
                  ? `@${cleanInstagram} (https://www.instagram.com/${cleanInstagram})`
                  : '………………………………………………………………',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Agissant en qualité d’auteur personne physique titulaire des droits, ci-après dénommé « L’Auteur », d’une part,',
                italics: true,
                size: 19,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: '2° Le Bénéficiaire (Le Cessionnaire) :', bold: true, size: 20 })],
          }),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'Enseigne / Nom commercial : ', bold: true, size: 20 }),
              new TextRun({ text: data.cessionnaireDenomination?.trim() || 'Évasion Littorale', size: 20 }),
            ],
          }),
          ...(data.cessionnaireRepresentant?.trim()
            ? [
                new Paragraph({
                  indent: { left: 280 },
                  spacing: { after: 30 },
                  children: [
                    new TextRun({ text: 'Titulaire légal : ', bold: true, size: 20 }),
                    new TextRun({ text: data.cessionnaireRepresentant.trim(), size: 20 }),
                  ],
                }),
              ]
            : []),
          ...(siretCessionnaire
            ? [
                new Paragraph({
                  indent: { left: 280 },
                  spacing: { after: 30 },
                  children: [
                    new TextRun({ text: 'Numéro SIRET : ', bold: true, size: 20 }),
                    new TextRun({ text: siretCessionnaire, size: 20 }),
                  ],
                }),
              ]
            : []),
          ...(data.cessionnaireAdresse?.trim()
            ? [
                new Paragraph({
                  indent: { left: 280 },
                  spacing: { after: 30 },
                  children: [
                    new TextRun({ text: 'Adresse : ', bold: true, size: 20 }),
                    new TextRun({ text: data.cessionnaireAdresse.trim(), size: 20 }),
                  ],
                }),
              ]
            : []),
          ...(data.cessionnaireEmail?.trim()
            ? [
                new Paragraph({
                  indent: { left: 280 },
                  spacing: { after: 30 },
                  children: [
                    new TextRun({ text: 'Adresse e-mail : ', bold: true, size: 20 }),
                    new TextRun({ text: data.cessionnaireEmail.trim(), size: 20 }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            indent: { left: 280 },
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: 'Ci-après dénommé « Le Bénéficiaire », d’autre part.',
                italics: true,
                size: 19,
              }),
            ],
          }),

          articleHeading('Préambule'),
          bodyPara(
            `L’Auteur déclare être le créateur original et l’unique titulaire des droits de propriété intellectuelle sur les photographies désignées à l’Article 1 (qu’il agisse à titre particulier, amateur ou professionnel). Le Bénéficiaire souhaite diffuser ces photographies ${destinationSummary}. Conformément aux articles L. 131-1 et L. 131-3 du Code de la propriété intellectuelle, le présent contrat délimite les photographies existantes concernées ainsi que l’étendue, la destination, le territoire et la durée de l’autorisation accordée.`,
          ),

          articleHeading('Article 1 – Photographies concernées'),
          ...(photoItems.length > 0
            ? [
                bodyPara(
                  `La présente autorisation porte exclusivement sur les ${photoItems.length} photographie${photoItems.length > 1 ? 's' : ''} existante${photoItems.length > 1 ? 's' : ''} réalisée${photoItems.length > 1 ? 's' : ''} par l’Auteur${cleanInstagram ? ` (compte Instagram @${cleanInstagram})` : ''}, désignée${photoItems.length > 1 ? 's' : ''} ci-après et reproduite${photoItems.length > 1 ? 's' : ''} visuellement en Annexe 1 du présent contrat :`,
                ),
                ...photoItems.map((item, idx) =>
                  bulletPara(`Réf. Photo n°${idx + 1} : `, `${item.label} (visuel reproduit en Annexe 1)`),
                ),
              ]
            : [
                bodyPara(
                  `La présente autorisation porte sur les photographies existantes réalisées par l’Auteur${cleanInstagram ? ` (notamment issues de son compte Instagram @${cleanInstagram})` : ''}, identifiées ci-dessous ou transmises par l’Auteur au Bénéficiaire à la date de signature du présent contrat.`,
                ),
              ]),
          ...(publicationsList.length > 0
            ? publicationsList.map(
                (line) =>
                  new Paragraph({
                    numbering: { reference: 'photos-numbers', level: 0 },
                    spacing: { after: 60 },
                    children: [new TextRun({ text: line, size: 20 })],
                  }),
              )
            : []),

          articleHeading('Article 2 – Nature et étendue des droits accordés'),
          bodyPara(
            'L’Auteur cède au Bénéficiaire, à titre non exclusif (l’Auteur conservant la pleine liberté d’exploiter ses photographies par ailleurs), les droits patrimoniaux suivants :',
          ),
          bulletPara(
            'Droit de reproduction numérique : ',
            'le droit d’enregistrer, stocker, héberger et adapter techniquement le format des photographies (redimensionnement, recadrage adapté aux écrans web et mobile, compression) dans le respect de l’intégrité visuelle de l’œuvre ;',
          ),
          bulletPara(
            'Droit de représentation et diffusion publique : ',
            'le droit de publier, diffuser et communiquer les photographies au public en ligne, sur les supports définis à l’Article 3.',
          ),
          bodyPara(
            'Toute exploitation sur support papier commercial (affiches, brochures payantes) ainsi que toute revente ou cession des fichiers à des tiers demeurent exclues sans accord écrit complémentaire de l’Auteur.',
          ),

          articleHeading('Article 3 – Supports d’exploitation autorisés (Destination)'),
          bodyPara('Le Bénéficiaire est autorisé à publier et exploiter les photographies sur les supports suivants :'),
          ...(useSite
            ? [
                bulletPara(
                  'Site internet du Bénéficiaire : ',
                  `${data.siteUrlPrincipale?.trim() || 'site internet officiel administré par le Bénéficiaire'}.`,
                ),
              ]
            : []),
          ...(useSocial
            ? [
                bulletPara(
                  'Réseaux sociaux officiels du Bénéficiaire : ',
                  `publications, carrousels, stories ou vidéos courtes (reels) sur les comptes officiels du Bénéficiaire${formattedSocials ? ` (${formattedSocials})` : ' (notamment Instagram, Facebook, LinkedIn, Pinterest, TikTok)'}.`,
                ),
              ]
            : []),

          articleHeading('Article 4 – Territoire et durée'),
          bodyPara(
            `En raison de la nature mondiale d’Internet et des réseaux sociaux, la présente autorisation est consentie pour le monde entier et pour une durée déterminée de ${dureeChiffres} (${dureeMots}) ans à compter de la date de signature du présent contrat.`,
          ),

          articleHeading('Article 5 – Conditions financières'),
          isGracieux
            ? bodyPara(
                'Conformément à l’article L. 131-4 du Code de la propriété intellectuelle, la présente cession est consentie à titre gracieux (gratuit), en contrepartie de la visibilité accordée à l’Auteur et de la mention de son crédit photographique. L’Auteur déclare renoncer expressément à toute rémunération financière au titre des exploitations prévues au présent contrat.',
              )
            : bodyPara(
                `Conformément à l’article L. 131-4, alinéa 2 du Code de la propriété intellectuelle, la présente cession est consentie moyennant le règlement d’une rémunération forfaitaire globale et définitive de ${data.remunerationMontant?.trim() || '……………… €'}.`,
              ),

          articleHeading('Article 6 – Droit moral et crédit photographique'),
          bodyPara(
            `Conformément à l’article L. 121-1 du Code de la propriété intellectuelle, le Bénéficiaire s’engage à respecter l’intégrité des photographies et à mentionner la paternité de l’Auteur sous la forme : « ${creditText} ». Sur le site internet, ce crédit est apposé sous l’image ou au sein de la page Crédits / Mentions légales. Sur les réseaux sociaux, le compte de l’Auteur est mentionné en légende ou par identification sur la publication.`,
          ),

          articleHeading('Article 7 – Garantie d’originalité et droit à l’image'),
          bodyPara(
            data.garantieDroitImage && data.garantieDroitImage.startsWith('Non')
              ? 'L’Auteur garantit être l’unique créateur des photographies cédées. Les Parties constatent que les photographies concernées représentent des paysages, lieux ou biens ne comportant aucune personne physique identifiable nécessitant une autorisation relative au droit à l’image.'
              : 'L’Auteur garantit être l’unique créateur des photographies cédées. Dans l’hypothèse où des personnes physiques identifiables ou des biens privés figurent sur les photographies, l’Auteur déclare et garantit avoir recueilli l’accord préalable des personnes concernées pour la diffusion en ligne prévue au présent contrat, et assume seul la responsabilité d’éventuelles réclamations de tiers à ce titre.',
          ),

          articleHeading('Article 8 – Résiliation et droit applicable'),
          bodyPara(
            'En cas de manquement par l’une des Parties à l’une de ses obligations essentielles (notamment l’absence de mention du crédit de l’Auteur après demande écrite) non réparé dans un délai de trente (30) jours, le présent contrat pourra être résilié de plein droit et les photographies seront retirées des supports du Bénéficiaire. Le présent contrat est régi par le droit français.',
          ),

          new Paragraph({
            spacing: { before: 240, after: 120 },
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 8 } },
            children: [
              new TextRun({
                text: `Fait à ${data.villeSignature?.trim() || 'Saint-Jean-de-Monts'}, le ${dateStr}, en deux (2) exemplaires.`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          signaturesTable,
          ...(photoItems.length > 0
            ? [
                new Paragraph({ children: [new PageBreak()] }),
                articleHeading('Annexe 1 – Photographies et captures de référence'),
                bodyPara(`Photographies visées à l’Article 1 du contrat signé le ${dateStr} :`),
                ...photoItems.flatMap((item, idx) => {
                  const img = dataUrlToImage(item.src)
                  const elems: Paragraph[] = [
                    new Paragraph({
                      spacing: { before: 140, after: 60 },
                      children: [
                        new TextRun({ text: `Réf. Photo n°${idx + 1} — ${item.label}`, bold: true, size: 20 }),
                      ],
                    }),
                  ]
                  if (img) {
                    elems.push(
                      new Paragraph({
                        spacing: { after: 160 },
                        children: [
                          new ImageRun({
                            type: img.type,
                            data: img.bytes,
                            transformation: { width: 260, height: 195 },
                            altText: {
                              title: item.label,
                              description: item.label,
                              name: `photo-${idx + 1}`,
                            },
                          }),
                        ],
                      }),
                    )
                  }
                  return elems
                }),
              ]
            : []),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
