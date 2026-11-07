import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import './../../lib/fonts'
import { formatAllSocialAccounts, formatDate, parsePhotoItems, yearsToWords } from '../../lib/format'
import type { ContratCessionData } from './types'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.8,
    lineHeight: 1.35,
    color: '#000000',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
  },

  runningHeader: {
    position: 'absolute',
    top: 16,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 3,
  },
  runningHeaderText: {
    fontSize: 7.5,
    color: '#555555',
  },

  runningFooter: {
    position: 'absolute',
    bottom: 16,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 3,
  },
  footerText: {
    fontSize: 7.5,
    color: '#555555',
  },

  // En-tête sobre et textuel
  docHeader: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  subTitle: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    color: '#333333',
    textAlign: 'center',
  },

  // Sections et titres d'articles
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: 5,
    marginBottom: 5,
  },
  articleHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: 7,
    marginBottom: 3,
  },

  // Paragraphes
  paragraph: {
    fontSize: 8.7,
    lineHeight: 1.34,
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Bloc Parties multi-lignes
  partyBlock: {
    marginBottom: 6,
    paddingLeft: 6,
  },
  partyBlockTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.8,
    marginBottom: 2,
  },
  partyDetailRow: {
    fontSize: 8.6,
    lineHeight: 1.32,
    paddingLeft: 8,
    marginBottom: 1,
  },
  partyClosing: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8.3,
    paddingLeft: 8,
    marginTop: 2,
  },

  // Listes à puces sobres
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    paddingLeft: 8,
  },
  bulletSymbol: {
    width: 10,
    fontSize: 8.7,
  },
  bulletContent: {
    flex: 1,
    fontSize: 8.7,
    lineHeight: 1.32,
    textAlign: 'justify',
  },

  // Bloc signatures sobre en bas de contrat
  signaturesWrapper: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.75,
    borderTopColor: '#000000',
  },
  signaturesColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 6,
  },
  signatureCol: {
    flex: 1,
  },
  signatureColTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  signatureMeta: {
    fontSize: 8.4,
    marginBottom: 2,
  },
  signatureMention: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    color: '#222222',
    marginTop: 2,
    marginBottom: 5,
  },
  signatureApprovalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  checkboxBox: {
    width: 9,
    height: 9,
    borderWidth: 0.8,
    borderColor: '#0f172a',
    borderRadius: 1.5,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0f172a',
  },
  checkboxInnerCheck: {
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 8,
  },
  signatureHandwrittenMention: {
    fontFamily: 'Caveat',
    fontSize: 12,
    color: '#1e3a8a',
  },
  signaturePlaceholderMention: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 7.8,
    color: '#555555',
  },
  signatureArea: {
    height: 48,
    justifyContent: 'flex-start',
  },
  signatureImg: {
    maxHeight: 46,
    maxWidth: 150,
    objectFit: 'contain',
  },

  // Grille de captures / photos en Annexe 1
  annexeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  annexePhotoItem: {
    width: '48%',
    marginBottom: 10,
  },
  annexePhotoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    marginBottom: 4,
  },
  annexePhotoImg: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
  },
})

interface Props {
  data: ContratCessionData
}

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

function PartyLine({ label, value }: { label: string; value?: string }) {
  if (!value || !value.trim() || value.trim().toLowerCase() === 'sans objet') return null
  return (
    <Text style={s.partyDetailRow}>
      <Text style={{ fontFamily: 'Helvetica-Bold' }}>{label} : </Text>
      {value.trim()}
    </Text>
  )
}

export function ContratCession({ data }: Props) {
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

  const dureeChiffres = (data.dureeAnnees || '10').trim()
  const dureeMots = data.dureeLettres?.trim() || yearsToWords(dureeChiffres)

  const photoItems = parsePhotoItems(data.annexeImage)
  const publicationsList = (data.annexePublications || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const hasAuteurSig = Boolean(data.auteurSignature && data.auteurSignature.trim() !== '')
  const hasCessionnaireSig = Boolean(data.cessionnaireSignature && data.cessionnaireSignature.trim() !== '')

  const hasSeparateAnnexe = photoItems.length > 0 || publicationsList.length > 6

  const creditText = cleanInstagram
    ? `© ${data.auteurNom || "Nom de l'Auteur"} (@${cleanInstagram})`
    : `© ${data.auteurNom || "Nom de l'Auteur"}`

  const destinationSummary =
    useSite && useSocial
      ? 'sur son site internet et ses réseaux sociaux officiels'
      : useSite
        ? 'sur son site internet officiel'
        : 'sur ses réseaux sociaux officiels'

  return (
    <Document>
      {/* =========================================================================
          PAGE 1 : TEXTE DU CONTRAT (PARTIES SUR PLUSIEURS LIGNES, PRÉAMBULE, ART. 1-4)
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        <View fixed style={s.runningFooter}>
          <Text style={s.footerText}>Contrat de cession de droits photographiques — Réf. {numContrat}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Titre sobre */}
        <View style={s.docHeader}>
          <Text style={s.mainTitle}>Contrat d’autorisation et de cession de droits photographiques</Text>
          <Text style={s.subTitle}>
            Soumis aux dispositions des articles L. 111-1, L. 121-1 et L. 131-1 à L. 131-4 du Code de la propriété
            intellectuelle
          </Text>
        </View>

        {/* Identification des Parties (chaque information sur sa propre ligne) */}
        <Text style={s.sectionTitle}>Entre les soussignés :</Text>

        <View style={s.partyBlock}>
          <Text style={s.partyBlockTitle}>1° Le Photographe (L’Auteur) :</Text>
          <PartyLine label="Nom et prénom" value={data.auteurNom?.trim() || '………………………………………………………………'} />
          <PartyLine label="Adresse postale" value={data.auteurAdresse?.trim() || '………………………………………………………………'} />
          <PartyLine label="Adresse e-mail" value={data.auteurEmail?.trim() || '………………………………………………………………'} />
          <PartyLine
            label="Compte Instagram"
            value={
              cleanInstagram
                ? `@${cleanInstagram} (https://www.instagram.com/${cleanInstagram})`
                : '………………………………………………………………'
            }
          />
          <Text style={s.partyClosing}>
            Agissant en qualité d’auteur personne physique titulaire des droits, ci-après dénommé « L’Auteur », d’une
            part,
          </Text>
        </View>

        <View style={s.partyBlock}>
          <Text style={s.partyBlockTitle}>2° Le Bénéficiaire (Le Cessionnaire) :</Text>
          <PartyLine label="Enseigne / Nom commercial" value={data.cessionnaireDenomination || 'Évasion Littorale'} />
          <PartyLine label="Titulaire légal" value={data.cessionnaireRepresentant} />
          <PartyLine label="Numéro SIRET" value={siretCessionnaire} />
          <PartyLine label="Adresse" value={data.cessionnaireAdresse} />
          <PartyLine label="Adresse e-mail" value={data.cessionnaireEmail} />
          <Text style={s.partyClosing}>Ci-après dénommé « Le Bénéficiaire », d’autre part.</Text>
        </View>

        <Text style={s.paragraph}>
          L’Auteur et le Bénéficiaire étant ci-après dénommés ensemble « les Parties ».
        </Text>

        {/* Préambule */}
        <Text style={s.articleHeading}>Préambule</Text>
        <Text style={s.paragraph}>
          {`L’Auteur déclare être le créateur original et l’unique titulaire des droits de propriété intellectuelle sur les photographies désignées à l’Article 1 (qu’il agisse à titre particulier, amateur ou professionnel). Le Bénéficiaire souhaite diffuser ces photographies ${destinationSummary}. Conformément aux articles L. 131-1 et L. 131-3 du Code de la propriété intellectuelle, le présent contrat délimite les photographies existantes concernées ainsi que l’étendue, la destination, le territoire et la durée de l’autorisation accordée.`}
        </Text>

        {/* Article 1 */}
        <Text style={s.articleHeading}>Article 1 – Photographies concernées</Text>
        {photoItems.length > 0 ? (
          photoItems.length <= 4 ? (
            <>
              <Text style={s.paragraph}>
                {`La présente autorisation porte exclusivement sur les ${photoItems.length} photographie${photoItems.length > 1 ? 's' : ''} existante${photoItems.length > 1 ? 's' : ''} réalisée${photoItems.length > 1 ? 's' : ''} par l’Auteur${cleanInstagram ? ` (compte Instagram @${cleanInstagram})` : ''}, désignée${photoItems.length > 1 ? 's' : ''} ci-après et reproduite${photoItems.length > 1 ? 's' : ''} visuellement en Annexe 1 du présent contrat :`}
              </Text>
              {photoItems.map((item, idx) => (
                <View key={idx} style={s.bulletRow}>
                  <Text style={s.bulletSymbol}>-</Text>
                  <Text style={s.bulletContent}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{`Réf. Photo n°${idx + 1} : `}</Text>
                    {`${item.label} (visuel reproduit en Annexe 1)`}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={s.paragraph}>
              {`La présente autorisation porte exclusivement sur les ${photoItems.length} photographies existantes réalisées par l’Auteur${cleanInstagram ? ` (compte Instagram @${cleanInstagram})` : ''}, dont la liste numérotée et les visuels de référence figurent en Annexe 1 du présent contrat.`}
            </Text>
          )
        ) : (
          <Text style={s.paragraph}>
            {`La présente autorisation porte sur les photographies existantes réalisées par l’Auteur${cleanInstagram ? ` (notamment issues de son compte Instagram @${cleanInstagram})` : ''}, identifiées ci-dessous ou transmises par l’Auteur au Bénéficiaire à la date de signature du présent contrat.`}
          </Text>
        )}
        {!hasSeparateAnnexe && publicationsList.length > 0
          ? publicationsList.map((line, idx) => (
              <View key={idx} style={s.bulletRow}>
                <Text style={s.bulletSymbol}>-</Text>
                <Text style={s.bulletContent}>{line}</Text>
              </View>
            ))
          : null}

        {/* Article 2 */}
        <Text style={s.articleHeading}>Article 2 – Nature et étendue des droits accordés</Text>
        <Text style={s.paragraph}>
          L’Auteur cède au Bénéficiaire, à titre non exclusif (l’Auteur conservant la pleine liberté d’exploiter ses
          photographies par ailleurs), les droits patrimoniaux suivants :
        </Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletSymbol}>-</Text>
          <Text style={s.bulletContent}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Droit de reproduction numérique : </Text>
            le droit d’enregistrer, stocker, héberger et adapter techniquement le format des photographies
            (redimensionnement, recadrage adapté aux écrans web et mobile, compression) dans le respect de l’intégrité
            visuelle de l’œuvre ;
          </Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletSymbol}>-</Text>
          <Text style={s.bulletContent}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Droit de représentation et diffusion publique : </Text>
            le droit de publier, diffuser et communiquer les photographies au public en ligne, sur les supports définis
            à l’Article 3.
          </Text>
        </View>
        <Text style={[s.paragraph, { marginTop: 2 }]}>
          Toute exploitation sur support papier commercial (affiches, brochures payantes) ainsi que toute revente ou
          cession des fichiers à des tiers demeurent exclues sans accord écrit complémentaire de l’Auteur.
        </Text>

        {/* Article 3 */}
        <Text style={s.articleHeading}>Article 3 – Supports d’exploitation autorisés (Destination)</Text>
        <Text style={s.paragraph}>
          Le Bénéficiaire est autorisé à publier et exploiter les photographies sur les supports suivants :
        </Text>
        {useSite ? (
          <View style={s.bulletRow}>
            <Text style={s.bulletSymbol}>-</Text>
            <Text style={s.bulletContent}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Site internet du Bénéficiaire : </Text>
              {`${data.siteUrlPrincipale?.trim() || 'site internet officiel administré par le Bénéficiaire'}${data.siteUrlSecondaire?.trim() ? ` (et ${data.siteUrlSecondaire.trim()})` : ''}.`}
            </Text>
          </View>
        ) : null}
        {useSocial ? (
          <View style={s.bulletRow}>
            <Text style={s.bulletSymbol}>-</Text>
            <Text style={s.bulletContent}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Réseaux sociaux officiels du Bénéficiaire : </Text>
              {`publications, carrousels, stories ou vidéos courtes (reels) sur les comptes officiels du Bénéficiaire${formattedSocials ? ` (${formattedSocials})` : ' (notamment Instagram, Facebook, LinkedIn, Pinterest, TikTok)'}.`}
            </Text>
          </View>
        ) : null}

        {/* Article 4 */}
        <Text style={s.articleHeading}>Article 4 – Territoire et durée</Text>
        <Text style={s.paragraph}>
          {`En raison de la nature mondiale d’Internet et des réseaux sociaux, la présente autorisation est consentie pour le monde entier et pour une durée déterminée de ${dureeChiffres} (${dureeMots}) ans à compter de la date de signature du présent contrat.`}
        </Text>
      </Page>

      {/* =========================================================================
          PAGE 2 : ARTICLES 5 À 8 + SIGNATURES AVEC « LU ET APPROUVÉ »
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        <View fixed style={s.runningHeader}>
          <Text style={s.runningHeaderText}>Contrat de cession de droits photographiques</Text>
          <Text style={s.runningHeaderText}>Réf. {numContrat}</Text>
        </View>

        <View fixed style={s.runningFooter}>
          <Text style={s.footerText}>Contrat de cession de droits photographiques — Réf. {numContrat}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Article 5 */}
        <Text style={[s.articleHeading, { marginTop: 4 }]}>Article 5 – Conditions financières</Text>
        {isGracieux ? (
          <Text style={s.paragraph}>
            Conformément à l’article L. 131-4 du Code de la propriété intellectuelle, la présente cession est consentie
            à titre gracieux (gratuit), en contrepartie de la visibilité accordée à l’Auteur et de la mention de son
            crédit photographique. L’Auteur déclare renoncer expressément à toute rémunération financière au titre des
            exploitations prévues au présent contrat.
          </Text>
        ) : (
          <Text style={s.paragraph}>
            {`Conformément à l’article L. 131-4, alinéa 2 du Code de la propriété intellectuelle, la présente cession est consentie moyennant le règlement d’une rémunération forfaitaire globale et définitive de ${data.remunerationMontant?.trim() || '……………… €'}.`}
          </Text>
        )}

        {/* Article 6 */}
        <Text style={s.articleHeading}>Article 6 – Droit moral et crédit photographique</Text>
        <Text style={s.paragraph}>
          {`Conformément à l’article L. 121-1 du Code de la propriété intellectuelle, le Bénéficiaire s’engage à respecter l’intégrité des photographies et à mentionner la paternité de l’Auteur sous la forme : « ${creditText} ». Sur le site internet, ce crédit est apposé sous l’image ou au sein de la page Crédits / Mentions légales. Sur les réseaux sociaux, le compte de l’Auteur est mentionné en légende ou par identification sur la publication.`}
        </Text>

        {/* Article 7 */}
        <Text style={s.articleHeading}>Article 7 – Garantie d’originalité et droit à l’image</Text>
        <Text style={s.paragraph}>
          L’Auteur garantit être l’unique créateur des photographies cédées et qu’elles ne constituent ni des copies ni
          des republications d’œuvres de tiers.
        </Text>
        {data.garantieDroitImage && data.garantieDroitImage.startsWith('Non') ? (
          <Text style={s.paragraph}>
            Les Parties constatent que les photographies concernées représentent des paysages, lieux ou biens ne
            comportant aucune personne physique identifiable nécessitant une autorisation relative au droit à l’image.
          </Text>
        ) : (
          <Text style={s.paragraph}>
            Dans l’hypothèse où des personnes physiques identifiables ou des biens privés figurent sur les
            photographies, l’Auteur déclare et garantit avoir recueilli l’accord préalable des personnes concernées pour
            la diffusion en ligne prévue au présent contrat, et assume seul la responsabilité d’éventuelles réclamations
            de tiers à ce titre.
          </Text>
        )}

        {/* Article 8 */}
        <Text style={s.articleHeading}>Article 8 – Résiliation et droit applicable</Text>
        <Text style={s.paragraph}>
          En cas de manquement par l’une des Parties à l’une de ses obligations essentielles (notamment l’absence de
          mention du crédit de l’Auteur après demande écrite) non réparé dans un délai de trente (30) jours, le présent
          contrat pourra être résilié de plein droit et les photographies seront retirées des supports du Bénéficiaire.
          Le présent contrat est régi par le droit français.
        </Text>

        {/* Signatures sobres avec mention Lu et approuvé */}
        <View wrap={false} style={s.signaturesWrapper}>
          <Text style={s.paragraph}>
            {`Fait à ${data.villeSignature?.trim() || 'Saint-Jean-de-Monts'}, le ${dateStr}, en deux (2) exemplaires.`}
          </Text>

          <View style={s.signaturesColumns}>
            {/* Colonne Photographe */}
            <View style={s.signatureCol}>
              <Text style={s.signatureColTitle}>Pour l’Auteur (Le Photographe)</Text>
              <Text style={s.signatureMeta}>Nom : {data.auteurNom?.trim() || '…………………………………………'}</Text>
              <View style={s.signatureApprovalRow}>
                <View style={[s.checkboxBox, hasAuteurSig ? s.checkboxChecked : {}]}>
                  {hasAuteurSig ? <Text style={s.checkboxInnerCheck}>✓</Text> : null}
                </View>
                {hasAuteurSig ? (
                  <Text style={s.signatureHandwrittenMention}>Lu et approuvé, bon pour accord</Text>
                ) : (
                  <Text style={s.signaturePlaceholderMention}>« Lu et approuvé, bon pour accord »</Text>
                )}
              </View>
              <View style={s.signatureArea}>
                {data.auteurSignature ? <Image style={s.signatureImg} src={data.auteurSignature} /> : null}
              </View>
            </View>

            {/* Colonne Bénéficiaire */}
            <View style={s.signatureCol}>
              <Text style={s.signatureColTitle}>Pour le Bénéficiaire</Text>
              <Text style={s.signatureMeta}>
                {`${data.cessionnaireDenomination?.trim() || 'Évasion Littorale'}${data.cessionnaireRepresentant?.trim() ? ` — ${data.cessionnaireRepresentant.trim()}` : ''}`}
              </Text>
              <View style={s.signatureApprovalRow}>
                <View style={[s.checkboxBox, hasCessionnaireSig ? s.checkboxChecked : {}]}>
                  {hasCessionnaireSig ? <Text style={s.checkboxInnerCheck}>✓</Text> : null}
                </View>
                {hasCessionnaireSig ? (
                  <Text style={s.signatureHandwrittenMention}>Lu et approuvé, bon pour accord</Text>
                ) : (
                  <Text style={s.signaturePlaceholderMention}>« Lu et approuvé, bon pour accord »</Text>
                )}
              </View>
              <View style={s.signatureArea}>
                {data.cessionnaireSignature ? <Image style={s.signatureImg} src={data.cessionnaireSignature} /> : null}
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* =========================================================================
          PAGE 3 (OPTIONNELLE) : ANNEXE 1 (PLANCHE DES CAPTURES / PHOTOS)
      ========================================================================= */}
      {hasSeparateAnnexe ? (
        <Page size="A4" style={s.page}>
          <View fixed style={s.runningHeader}>
            <Text style={s.runningHeaderText}>Annexe 1 – Photographies et captures de référence</Text>
            <Text style={s.runningHeaderText}>Réf. {numContrat}</Text>
          </View>

          <View fixed style={s.runningFooter}>
            <Text style={s.footerText}>Contrat de cession de droits photographiques — Réf. {numContrat}</Text>
            <Text
              style={s.footerText}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
            />
          </View>

          <Text style={[s.sectionTitle, { marginTop: 4 }]}>Annexe 1 – Photographies / Captures de référence</Text>
          <Text style={s.paragraph}>
            {`Photographies visées à l’Article 1 du contrat signé le ${dateStr} :`}
          </Text>

          {publicationsList.map((line, idx) => (
            <View key={idx} style={s.bulletRow}>
              <Text style={s.bulletSymbol}>{idx + 1}.</Text>
              <Text style={s.bulletContent}>{line}</Text>
            </View>
          ))}

          {photoItems.length > 0 ? (
            <View style={s.annexeGrid}>
              {photoItems.map((item, idx) => (
                <View key={idx} wrap={false} style={s.annexePhotoItem}>
                  <Text style={s.annexePhotoLabel}>{`Réf. Photo n°${idx + 1} — ${item.label}`}</Text>
                  <Image style={s.annexePhotoImg} src={item.src} />
                </View>
              ))}
            </View>
          ) : null}
        </Page>
      ) : null}
    </Document>
  )
}
