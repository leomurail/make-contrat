import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND_FONT } from '../../lib/fonts'
import { formatDate } from '../../lib/format'
import type { ContratCessionData } from './types'

// Charte graphique juridique professionnelle
const c = {
  ink: '#111827', // Noir d'encre profond pour une lisibilité maximale
  inkLight: '#374151',
  muted: '#6b7280',
  brand: '#162b24', // Vert institutionnel noble
  brandAccent: '#23473b',
  border: '#cbd5e1', // Bordure fine et nette
  borderStrong: '#94a3b8',
  bgCard: '#f8fafc',
  bgHighlight: '#f1f5f9',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.38,
    color: c.ink,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
  },

  // En-tête courant (pages 2+)
  runningHeader: {
    position: 'absolute',
    top: 14,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 4,
  },
  runningHeaderTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  runningHeaderRef: {
    fontSize: 7.5,
    color: c.muted,
  },

  // Pied de page courant (toutes pages)
  runningFooter: {
    position: 'absolute',
    bottom: 14,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: c.border,
    paddingTop: 4,
  },
  footerParaphes: {
    fontSize: 7.5,
    color: c.muted,
  },
  footerPages: {
    fontSize: 7.5,
    color: c.muted,
    fontFamily: 'Helvetica-Bold',
  },

  // En-tête officiel Page 1
  headerPage1: {
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: c.brand,
    paddingBottom: 8,
  },
  badgeLegal: {
    alignSelf: 'flex-start',
    backgroundColor: c.brand,
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 2,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontFamily: BRAND_FONT,
    fontSize: 13.5,
    fontWeight: 'bold',
    color: c.brand,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  legalSubHeader: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Oblique',
    color: c.inkLight,
    lineHeight: 1.3,
  },

  // Section des Parties
  partiesIntro: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  partiesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  partyCard: {
    flex: 1,
    backgroundColor: c.bgCard,
    borderWidth: 0.75,
    borderColor: c.border,
    borderRadius: 3,
    padding: 8,
  },
  partyTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 3,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  partyLabel: {
    width: 95,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: c.inkLight,
  },
  partyValue: {
    flex: 1,
    fontSize: 8,
    color: c.ink,
  },
  partyMentionBottom: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Oblique',
    color: c.muted,
    marginTop: 3,
    textAlign: 'right',
  },
  partiesLinkSummary: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Oblique',
    color: c.muted,
    textAlign: 'center',
    marginBottom: 10,
  },

  // Préambule et Sections
  preambuleBlock: {
    backgroundColor: '#ffffff',
    borderWidth: 0.75,
    borderColor: c.border,
    borderRadius: 3,
    padding: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  articleHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    marginTop: 6,
    marginBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  subArticleHeading: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brandAccent,
    marginTop: 4,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 4,
    textAlign: 'justify',
  },

  // Puces et sous-listes
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    paddingLeft: 6,
  },
  bulletMarker: {
    width: 12,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brandAccent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  nestedIndent: {
    paddingLeft: 18,
    marginBottom: 3,
  },

  // Blocs de mise en avant (Cadres légaux)
  highlightCard: {
    backgroundColor: c.bgHighlight,
    borderLeftWidth: 3,
    borderLeftColor: c.brand,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginVertical: 3,
    borderRadius: 2,
  },
  creditBox: {
    backgroundColor: c.bgHighlight,
    borderWidth: 0.8,
    borderColor: c.brand,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
    alignItems: 'center',
    marginVertical: 4,
  },
  highlightCardText: {
    fontSize: 8.2,
    lineHeight: 1.35,
    color: c.ink,
  },

  // Checkboxes robustes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  checkboxBox: {
    width: 18,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
  },

  // Signatures
  signaturesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.borderStrong,
  },
  signaturesIntro: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 2,
  },
  signaturesInstruction: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Oblique',
    color: c.muted,
    marginBottom: 6,
  },
  signaturesCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  signatureCard: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: c.borderStrong,
    borderRadius: 3,
    padding: 8,
    backgroundColor: '#ffffff',
    minHeight: 135,
  },
  signaturePartyTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  signatureMentionReq: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Oblique',
    color: c.muted,
    marginBottom: 4,
    lineHeight: 1.25,
  },
  signatureLine: {
    fontSize: 8,
    marginBottom: 2,
  },
  signatureBoxContent: {
    marginTop: 6,
    height: 52,
    borderWidth: 0.5,
    borderColor: c.border,
    borderRadius: 2,
    backgroundColor: c.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImage: {
    maxHeight: 48,
    maxWidth: 160,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 7.5,
    color: c.muted,
    fontFamily: 'Helvetica-Oblique',
  },

  // Page 4 : Annexe 1
  annexeHeaderBox: {
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: c.brand,
    paddingBottom: 6,
  },
  annexeMainTitle: {
    fontFamily: BRAND_FONT,
    fontSize: 12.5,
    fontWeight: 'bold',
    color: c.brand,
    marginBottom: 2,
  },
  annexeNotice: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: c.muted,
    lineHeight: 1.3,
  },
  annexeTable: {
    backgroundColor: c.bgCard,
    borderWidth: 0.75,
    borderColor: c.border,
    borderRadius: 3,
    padding: 8,
    marginBottom: 10,
  },
  annexeTableTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.brand,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  annexeItem: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 3,
  },
  annexeIndex: {
    width: 18,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: c.brandAccent,
  },
  annexeText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.35,
  },
  screenshotCard: {
    borderWidth: 0.75,
    borderColor: c.border,
    borderRadius: 3,
    padding: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  screenshotTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: c.inkLight,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  screenshotImg: {
    maxHeight: 380,
    maxWidth: '100%',
    objectFit: 'contain',
  },
})

interface Props {
  data: ContratCessionData
}

export function ContratCession({ data }: Props) {
  const cleanInstagram = (data.auteurInstagram || '').replace(/^@+/, '').trim()
  const isGracieux =
    !data.remunerationType ||
    data.remunerationType.includes('gracieux') ||
    data.remunerationType.includes('gratuit')
  const dateStr = formatDate(data.dateSignature) || data.dateSignature
  const numContrat = data.numero ? `CTR-${data.numero}` : 'Brouillon'

  return (
    <Document>
      {/* =========================================================================
          PAGE 1 : EN-TÊTE + IDENTIFICATION COMPLÈTE DES PARTIES + PRÉAMBULE
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        {/* Pied de page fixe */}
        <View fixed style={s.runningFooter}>
          <Text style={s.footerParaphes}>Paraphes : [     ] L’Auteur       [     ] Le Cessionnaire</Text>
          <Text
            style={s.footerPages}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Titre et référence juridique */}
        <View style={s.headerPage1}>
          <Text style={s.badgeLegal}>RÉPUBLIQUE FRANÇAISE • CODE DE LA PROPRIÉTÉ INTELLECTUELLE</Text>
          <Text style={s.mainTitle}>CONTRAT DE CESSION DE DROITS D’AUTEUR SUR ŒUVRES PHOTOGRAPHIQUES</Text>
          <Text style={s.legalSubHeader}>
            Régie par les dispositions des articles L. 111-1 et suivants, L. 121-1 et suivants, et L. 131-1 et suivants
            du Code de la propriété intellectuelle (droit français).
          </Text>
        </View>

        {/* Identification des Parties */}
        <Text style={s.partiesIntro}>ENTRE LES SOUSSIGNÉS :</Text>
        <View style={s.partiesContainer}>
          {/* 1. L'Auteur */}
          <View style={s.partyCard}>
            <Text style={s.partyTitle}>1. L’Auteur (Le Cédant)</Text>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Nom et prénom :</Text>
              <Text style={s.partyValue}>{data.auteurNom || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Compte Instagram :</Text>
              <Text style={s.partyValue}>{cleanInstagram ? `@${cleanInstagram}` : '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Adresse de domicile :</Text>
              <Text style={s.partyValue}>{data.auteurAdresse || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Statut professionnel :</Text>
              <Text style={s.partyValue}>{data.auteurStatut || 'Particulier'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>N° SIRET / N° d’ordre :</Text>
              <Text style={s.partyValue}>{data.auteurSiret || 'Sans objet'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Téléphone :</Text>
              <Text style={s.partyValue}>{data.auteurTelephone || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Adresse e-mail :</Text>
              <Text style={s.partyValue}>{data.auteurEmail || '—'}</Text>
            </View>
            <Text style={s.partyMentionBottom}>(Ci-après dénommé « L’Auteur ») — D’une part,</Text>
          </View>

          {/* 2. Le Cessionnaire */}
          <View style={s.partyCard}>
            <Text style={s.partyTitle}>2. Le Cessionnaire</Text>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Dénomination :</Text>
              <Text style={s.partyValue}>{data.cessionnaireDenomination || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Forme juridique :</Text>
              <Text style={s.partyValue}>{data.cessionnaireForme || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Capital social :</Text>
              <Text style={s.partyValue}>{data.cessionnaireCapital || 'Sans objet'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Siège social :</Text>
              <Text style={s.partyValue}>{data.cessionnaireAdresse || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Immatriculation :</Text>
              <Text style={s.partyValue}>{data.cessionnaireRcs || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Représentée par :</Text>
              <Text style={s.partyValue}>{data.cessionnaireRepresentant || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Téléphone :</Text>
              <Text style={s.partyValue}>{data.cessionnaireTelephone || '—'}</Text>
            </View>
            <View style={s.partyRow}>
              <Text style={s.partyLabel}>Adresse e-mail :</Text>
              <Text style={s.partyValue}>{data.cessionnaireEmail || '—'}</Text>
            </View>
            <Text style={s.partyMentionBottom}>(Ci-après dénommé « Le Cessionnaire ») — D’autre part.</Text>
          </View>
        </View>

        <Text style={s.partiesLinkSummary}>
          L’Auteur et le Cessionnaire étant ci-après individuellement dénommés « La Partie » et conjointement « Les Parties ».
        </Text>

        {/* Préambule */}
        <View style={s.preambuleBlock}>
          <Text style={s.sectionHeading}>PRÉAMBULE</Text>
          <Text style={s.bodyText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>1. </Text>
            L’Auteur déclare être le créateur exclusif, original et légitime titulaire des droits de propriété intellectuelle sur les œuvres photographiques diffusées sur son compte public du réseau social Instagram.
          </Text>
          <Text style={s.bodyText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>2. </Text>
            Le Cessionnaire édite et exploite un site internet professionnel accessible en ligne et souhaite y intégrer des photographies de l’Auteur afin d’en assurer l'illustration et l'ergonomie visuelle.
          </Text>
          <Text style={s.bodyText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>3. </Text>
            Conformément aux dispositions impératives de l’article L. 131-3 du Code de la propriété intellectuelle, la transmission des droits de l'auteur est subordonnée à la condition que chacun des droits cédés fasse l'objet d'une mention distincte dans l'acte de cession et que le domaine d'exploitation des droits cédés soit délimité quant à son étendue et à sa destination, quant au lieu et quant à la durée.
          </Text>
          <Text style={s.bodyText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>4. </Text>
            Conformément à l’article L. 131-1 du même Code, la cession globale des œuvres futures est formellement prohibée par la loi française. En conséquence, les Parties conviennent expressément que la présente convention est strictement bornée aux œuvres photographiques d'ores et déjà existantes et publiées sur le compte Instagram désigné ci-après à la date précise de signature des présentes.
          </Text>
        </View>

        <Text style={[s.bodyText, { textAlign: 'center', fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>
          IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :
        </Text>
      </Page>

      {/* =========================================================================
          PAGE 2 : ARTICLES 1 À 5 (OBJET, DROITS CÉDÉS, EXPLOITATION, ZONE, DURÉE)
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        {/* En-tête fixe */}
        <View fixed style={s.runningHeader}>
          <Text style={s.runningHeaderTitle}>Contrat de Cession de Droits d’Auteur — Photographies</Text>
          <Text style={s.runningHeaderRef}>Réf : {numContrat}</Text>
        </View>

        {/* Pied de page fixe */}
        <View fixed style={s.runningFooter}>
          <Text style={s.footerParaphes}>Paraphes : [     ] L’Auteur       [     ] Le Cessionnaire</Text>
          <Text
            style={s.footerPages}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Article 1 */}
        <Text style={s.articleHeading}>ARTICLE 1 – IDENTIFICATION ET DÉSIGNATION DES ŒUVRES VIA INSTAGRAM</Text>
        <Text style={s.bodyText}>
          Les œuvres photographiques faisant l'objet de la présente cession sont identifiées au travers du compte officiel Instagram de l'Auteur :
        </Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            Identifiant du compte Instagram : <Text style={{ fontFamily: 'Helvetica-Bold' }}>@{cleanInstagram || '—'}</Text>
          </Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            URL du profil officiel : <Text style={{ fontFamily: 'Helvetica-Bold' }}>https://www.instagram.com/{cleanInstagram || ''}/</Text>
          </Text>
        </View>
        <Text style={[s.bodyText, { marginTop: 3, fontFamily: 'Helvetica-Bold' }]}>
          Périmètre des photographies cédées :
        </Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Sélection spécifique de publications / posts identifiés :</Text> La présente cession porte exclusivement sur les photographies correspondant aux publications Instagram listées par leurs URL spécifiques au sein de l'Annexe 1 du présent contrat.
          </Text>
        </View>

        {/* Article 2 */}
        <Text style={s.articleHeading}>ARTICLE 2 – NATURE ET ÉTENDUE DES DROITS CÉDÉS</Text>
        <Text style={s.bodyText}>
          L’Auteur cède au Cessionnaire, sous les garanties et conditions stipulées aux présentes, les droits patrimoniaux d’auteur strictement définis ci-après :
        </Text>

        <Text style={s.subArticleHeading}>2.1. Droit de reproduction numérique</Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            Le droit de reproduire, télécharger, enregistrer, stocker et dupliquer les photographies visées à l'Article 1 sur tout serveur informatique, hébergement cloud ou réseau de diffusion de contenu (CDN) administré pour le compte du Cessionnaire.
          </Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            Le droit de procéder aux adaptations strictement techniques exigées par l'environnement web : redimensionnement, recadrage proportionnel (affichage adapté aux ordinateurs, tablettes et smartphones) et compression de fichier, sous réserve expresse de préserver la qualité esthétique fondamentale des œuvres.
          </Text>
        </View>

        <Text style={s.subArticleHeading}>2.2. Droit de représentation numérique</Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            Le droit de communiquer, diffuser et afficher publiquement lesdites photographies en ligne sur le réseau Internet, exclusivement au sein des pages du site web désigné à l'Article 3.
          </Text>
        </View>

        <Text style={s.subArticleHeading}>2.3. Exclusions expresses</Text>
        <Text style={s.bodyText}>
          Tous les droits non expressément énumérés aux articles 2.1 et 2.2 demeurent la propriété exclusive et entière de l’Auteur. Sont formellement exclus :
        </Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>Toute reproduction sur support papier ou imprimé (brochures, affiches, flyers, presse, catalogues) ;</Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>Toute diffusion publicitaire d'achat d'espace (bannières payantes, Google Ads display, affichage programmatique) sans avenant écrit préalable ;</Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>Toute réutilisation des fichiers sur des produits ou services destinés à la revente directe (merchandising) ;</Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>Toute sous-cession, licence secondaire ou mise à disposition à des tiers ou partenaires de la cliente.</Text>
        </View>

        {/* Article 3 */}
        <Text style={s.articleHeading}>ARTICLE 3 – DESTINATION ET SUPPORTS D’EXPLOITATION</Text>
        <Text style={s.bodyText}>
          La présente cession est consentie exclusivement pour la destination web suivante :
        </Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Support web autorisé :</Text> Site internet institutionnel ou commercial du Cessionnaire :
          </Text>
        </View>
        <View style={s.nestedIndent}>
          <Text style={s.bodyText}>
            - URL principale : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.siteUrlPrincipale || 'https://evasionlittorale.com'}</Text>
          </Text>
          {data.siteUrlSecondaire ? (
            <Text style={s.bodyText}>
              - URL secondaire : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.siteUrlSecondaire}</Text>
            </Text>
          ) : null}
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Finalité :</Text> Illustration visuelle éditoriale et mise en valeur de l'activité du Cessionnaire sur son site officiel.
          </Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>•</Text>
          <Text style={s.bulletText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Mise à disposition technique :</Text> Le Cessionnaire se charge de récupérer directement les visuels sur le compte Instagram de l'Auteur, ce dernier restant libre, à sa convenance, de lui transmettre les fichiers originaux.
          </Text>
        </View>

        {/* Article 4 */}
        <Text style={s.articleHeading}>ARTICLE 4 – ZONE GÉOGRAPHIQUE (TERRITOIRE)</Text>
        <Text style={s.bodyText}>
          En raison du caractère mondial et décentralisé du réseau Internet et de la plateforme Instagram, l'autorisation de diffusion sur le site web du Cessionnaire est concédée pour le monde entier.
        </Text>

        {/* Article 5 */}
        <Text style={s.articleHeading}>ARTICLE 5 – DURÉE DU CONTRAT</Text>
        <Text style={s.bodyText}>
          La présente cession est accordée pour une durée ferme et déterminée de :
        </Text>
        <View style={s.highlightCard}>
          <Text style={[s.highlightCardText, { fontFamily: 'Helvetica-Bold' }]}>
            {data.dureeAnnees || '5'} années ({data.dureeLettres || 'cinq'} ans) à compter de la date de signature des présentes.
          </Text>
        </View>
        <Text style={[s.bodyText, { marginTop: 2 }]}>Au terme de cette durée :</Text>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>1.</Text>
          <Text style={s.bulletText}>L'autorisation d'exploitation prend fin de plein droit sans formalité judiciaire ni mise en demeure préalable.</Text>
        </View>
        <View style={s.bulletRow}>
          <Text style={s.bulletMarker}>2.</Text>
          <Text style={s.bulletText}>Le Cessionnaire s'engage à retirer l'ensemble des photographies de son site internet et de ses serveurs publics, sauf signature d'un avenant écrit de renouvellement convenu entre les Parties.</Text>
        </View>
      </Page>

      {/* =========================================================================
          PAGE 3 : ARTICLES 6 À 10 + SIGNATURES DES PARTIES
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        {/* En-tête fixe */}
        <View fixed style={s.runningHeader}>
          <Text style={s.runningHeaderTitle}>Contrat de Cession de Droits d’Auteur — Photographies</Text>
          <Text style={s.runningHeaderRef}>Réf : {numContrat}</Text>
        </View>

        {/* Pied de page fixe */}
        <View fixed style={s.runningFooter}>
          <Text style={s.footerParaphes}>Paraphes : [     ] L’Auteur       [     ] Le Cessionnaire</Text>
          <Text
            style={s.footerPages}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Article 6 */}
        <Text style={s.articleHeading}>ARTICLE 6 – RÉMUNÉRATION DE LA CESSION</Text>
        <Text style={s.bodyText}>
          Conformément à l’article L. 131-4, alinéa 2 du Code de la propriété intellectuelle, les Parties constatent l’impossibilité pratique de baser la rémunération sur une recette proportionnelle liée à la simple visite d'un site web informatif ou marchand. En conséquence, les Parties conviennent expressément d’opter pour l’option ci-dessous :
        </Text>
        <View style={s.highlightCard}>
          {isGracieux ? (
            <Text style={s.highlightCardText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>[X] Cession consentie à titre gracieux : </Text>
              La présente cession est consentie à titre gratuit. L’Auteur déclare expressément et en toute connaissance de cause renoncer à toute indemnité ou contrepartie financière pour les exploitations strictement prévues au présent contrat.
            </Text>
          ) : (
            <Text style={s.highlightCardText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>[X] Rémunération forfaitaire : </Text>
              La présente cession est consentie moyennant le versement d'une rémunération forfaitaire et définitive de{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.remunerationMontant || '250 € HT'}</Text>, payable sous 30 jours à compter de la signature des présentes.
            </Text>
          )}
        </View>

        {/* Article 7 */}
        <Text style={s.articleHeading}>ARTICLE 7 – DROIT MORAL ET OBLIGATION DE PATERNITÉ (CRÉDITS)</Text>
        <Text style={s.bodyText}>
          Conformément aux dispositions de l’article L. 121-1 du Code de la propriété intellectuelle, le droit moral de l'Auteur est inaliénable, perpétuel et imprescriptible.
        </Text>
        <Text style={s.subArticleHeading}>1. Obligation de crédit / mention de paternité :</Text>
        <Text style={s.bodyText}>
          Le Cessionnaire s'engage de façon impérative à faire figurer la mention de paternité suivante lors de l'exploitation de chaque image :
        </Text>
        <View style={s.creditBox}>
          <Text style={[s.highlightCardText, { fontFamily: 'Helvetica-Bold' }]}>
            « © {data.auteurNom || "Nom de l'Auteur"} / Instagram : @{cleanInstagram || 'compte_instagram'} »
          </Text>
        </View>
        <Text style={s.bodyText}>
          Cette mention doit apparaître soit à proximité immédiate de chaque photographie, soit sur une page « Crédits photographiques / Mentions légales » directement accessible via un lien hypertexte visible sur l'ensemble des pages du site web.
        </Text>
        <Text style={s.subArticleHeading}>2. Respect de l'intégrité de l'œuvre :</Text>
        <Text style={s.bodyText}>
          Le Cessionnaire s'engage à ne pas dénaturer les photographies (interdiction de montages trompeurs, de filtres altérant substantiellement la colorimétrie ou d'associations à des contextes dégradants ou contraires aux bonnes mœurs).
        </Text>

        {/* Article 8 */}
        <Text style={s.articleHeading}>ARTICLE 8 – GARANTIES STRICTES LIÉES AU COMPTE INSTAGRAM ET AUX TIERS</Text>
        <Text style={s.subArticleHeading}>1. Titularité personnelle de l'Auteur :</Text>
        <Text style={s.bodyText}>
          L'Auteur garantit formellement au Cessionnaire qu'il est l'auteur unique et exclusif de l'ensemble des photographies publiées sur son compte Instagram visé à l'Article 1, qu'il ne s'agit en aucun cas de republications (reposts), de captures ou d'œuvres dérivées de tiers, et que les œuvres sont libres de tout gage, saisie ou droit revendiqué par un tiers.
        </Text>
        <Text style={s.subArticleHeading}>2. Droit à l'image des personnes et des biens privés :</Text>
        <View style={s.checkboxRow}>
          <Text style={s.checkboxBox}>[X]</Text>
          <Text style={s.bulletText}>
            {data.garantieDroitImage && data.garantieDroitImage.startsWith('Non') ? (
              <Text>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Mention expresse : </Text>
                Les photographies cédées représentent exclusivement des paysages naturels et éléments de lieux publics ne nécessitant aucune autorisation relative au droit à l'image des personnes ou des biens privés.
              </Text>
            ) : (
              <Text>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Garantie de l'Auteur : </Text>
                L’Auteur garantit détenir les autorisations écrites et régulières de fixation et de diffusion de l'image de toutes les personnes physiques identifiables ainsi que des éléments de propriété privée figurant sur les photographies de son compte Instagram.
              </Text>
            )}
          </Text>
        </View>

        {/* Article 9 & 10 */}
        <Text style={s.articleHeading}>ARTICLE 9 – RÉSILIATION ET FIN DE CONTRAT</Text>
        <Text style={s.bodyText}>
          En cas de manquement grave par l'une des Parties à l'une de ses obligations contractuelles (notamment le défaut de paiement du forfait ou la suppression récurrente des crédits d'auteur obligatoires), et trente (30) jours après une mise en demeure par lettre recommandée avec accusé de réception demeurée sans effet, le présent contrat sera résilié de plein droit. Le Cessionnaire devra alors retirer sans délai les photographies litigieuses de son site web.
        </Text>

        <Text style={s.articleHeading}>ARTICLE 10 – DROIT APPLICABLE ET ATTRIBUTION DE JURIDICTION</Text>
        <Text style={s.bodyText}>
          Le présent contrat est exclusivement régi et interprété conformément au droit français. Les Parties s'engagent à rechercher une solution amiable à tout différend relatif à la validité, l'interprétation ou l'exécution du présent contrat. À défaut d'accord amiable, tout litige sera porté devant les tribunaux compétents.
        </Text>

        {/* Signatures des Parties scellées sur Page 3 */}
        <View wrap={false} style={s.signaturesSection}>
          <Text style={s.signaturesIntro}>
            Fait à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.villeSignature || 'Venansault'}</Text>, le{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{dateStr}</Text>, en{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>deux (2)</Text> exemplaires originaux, chacune des Parties reconnaissant en avoir reçu un.
          </Text>
          <Text style={s.signaturesInstruction}>
            (Faire précéder chaque signature de la mention manuscrite obligatoire correspondante)
          </Text>

          <View style={s.signaturesCardsRow}>
            {/* Signature Cédant */}
            <View style={s.signatureCard}>
              <Text style={s.signaturePartyTitle}>POUR L’AUTEUR (LE CÉDANT) :</Text>
              <Text style={s.signatureLine}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Nom et Prénom : </Text>
                {data.auteurNom || '—'}
              </Text>
              <Text style={s.signatureMentionReq}>
                Mention manuscrite obligatoire : «{'\u00A0'}Bon pour accord et cession de droits{'\u00A0'}»
              </Text>
              <Text style={s.signatureLine}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Date : </Text>
                {dateStr}
              </Text>

              <View style={s.signatureBoxContent}>
                {data.auteurSignature ? (
                  <Image style={s.signatureImage} src={data.auteurSignature} />
                ) : (
                  <Text style={s.signaturePlaceholder}>Signature manuscrite du Cédant</Text>
                )}
              </View>
            </View>

            {/* Signature Cessionnaire */}
            <View style={s.signatureCard}>
              <Text style={s.signaturePartyTitle}>POUR LE CESSIONNAIRE :</Text>
              <Text style={s.signatureLine}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Dénomination : </Text>
                {data.cessionnaireDenomination || '—'}
              </Text>
              <Text style={s.signatureLine}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Représentant : </Text>
                {data.cessionnaireRepresentant || '—'}
              </Text>
              <Text style={s.signatureMentionReq}>
                Mention manuscrite obligatoire : «{'\u00A0'}Bon pour accord et acceptation de cession{'\u00A0'}»
              </Text>
              <Text style={s.signatureLine}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Date : </Text>
                {dateStr}
              </Text>

              <View style={s.signatureBoxContent}>
                {data.cessionnaireSignature ? (
                  <Image style={s.signatureImage} src={data.cessionnaireSignature} />
                ) : (
                  <Text style={s.signaturePlaceholder}>Signature et cachet du Cessionnaire</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* =========================================================================
          PAGE 4 : ANNEXE 1 – RELEVÉ DÉTAILLÉ DES ŒUVRES CÉDÉES
      ========================================================================= */}
      <Page size="A4" style={s.page}>
        {/* En-tête fixe */}
        <View fixed style={s.runningHeader}>
          <Text style={s.runningHeaderTitle}>Contrat de Cession de Droits d’Auteur — Annexe 1</Text>
          <Text style={s.runningHeaderRef}>Réf : {numContrat}</Text>
        </View>

        {/* Pied de page fixe */}
        <View fixed style={s.runningFooter}>
          <Text style={s.footerParaphes}>Paraphes : [     ] L’Auteur       [     ] Le Cessionnaire</Text>
          <Text
            style={s.footerPages}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* En-tête Annexe 1 */}
        <View style={s.annexeHeaderBox}>
          <Text style={s.badgeLegal}>DOCUMENT CONTRACTUEL ANNEXE</Text>
          <Text style={s.annexeMainTitle}>ANNEXE 1 – RELEVÉ DES ŒUVRES PHOTOGRAPHIQUES CÉDÉES</Text>
          <Text style={s.annexeNotice}>
            Conformément aux Articles 1 et Préambule 4 du contrat, la présente annexe dresse la liste stricte et limitative
            des photographies publiées sur le compte officiel Instagram @{cleanInstagram || 'auteur'} faisant l'objet de la cession
            à la date de signature des présentes.
          </Text>
        </View>

        {/* Liste des publications */}
        <View style={s.annexeTable}>
          <Text style={s.annexeTableTitle}>Publications Instagram faisant l'objet de la cession :</Text>
          {data.annexePublications ? (
            data.annexePublications.split('\n').filter(Boolean).map((line, idx) => (
              <View key={idx} style={s.annexeItem}>
                <Text style={s.annexeIndex}>{idx + 1}.</Text>
                <Text style={s.annexeText}>{line}</Text>
              </View>
            ))
          ) : (
            <Text style={s.annexeText}>Aucune publication spécifique mentionnée.</Text>
          )}
        </View>

        {/* Emplacement Capture d'écran horodatée */}
        <View style={s.screenshotCard}>
          <Text style={s.screenshotTitle}>Capture d’écran horodatée du compte Instagram à la date de signature :</Text>
          {data.annexeImage ? (
            <Image style={s.screenshotImg} src={data.annexeImage} />
          ) : (
            <View
              style={{
                width: '100%',
                height: 220,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: c.border,
                borderRadius: 3,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: c.bgCard,
              }}
            >
              <Text style={{ fontSize: 8.5, color: c.muted, fontFamily: 'Helvetica-Oblique' }}>
                (Emplacement réservé à la capture d'écran horodatée du compte Instagram ou du fil de publications)
              </Text>
              <Text style={{ fontSize: 7.5, color: c.muted, marginTop: 4 }}>
                Vous pouvez téléverser cette capture directement dans le formulaire sous l'onglet « Annexe 1 ».
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
