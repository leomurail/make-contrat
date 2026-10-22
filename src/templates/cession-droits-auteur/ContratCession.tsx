import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND_FONT } from '../../lib/fonts'
import { formatDate } from '../../lib/format'
import type { ContratCessionData } from './types'

// Palette sobre et élégante adaptée aux documents juridiques
const c = {
  primary: '#162b24', // Vert très sombre institutionnel
  secondary: '#365349',
  border: '#d6dad7',
  borderLight: '#eef0ef',
  cardBg: '#fafbfa',
  text: '#1a1f1d',
  muted: '#5e6864',
  highlight: '#24483c',
}

const s = StyleSheet.create({
  page: {
    fontFamily: BRAND_FONT,
    fontSize: 9.5,
    lineHeight: 1.45,
    color: c.text,
    paddingTop: 52,
    paddingBottom: 50,
    paddingHorizontal: 44,
  },

  // En-tête courant répété sur chaque page
  header: {
    position: 'absolute',
    top: 18,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 7.5,
    fontWeight: 'medium',
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRef: {
    fontSize: 7.5,
    color: c.muted,
    fontFamily: 'Helvetica',
  },

  // Pied de page courant avec pagination et zone de paraphe
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: c.border,
    paddingTop: 6,
  },
  footerParaphe: {
    fontSize: 7.5,
    color: c.muted,
  },
  footerPageNum: {
    fontSize: 7.5,
    color: c.muted,
  },

  // Titre principal du contrat
  titleSection: {
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: c.primary,
    paddingBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: c.secondary,
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: 'bold',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: c.primary,
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  legalBasis: {
    fontSize: 8,
    color: c.muted,
    lineHeight: 1.35,
  },

  // Section des parties
  partiesHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: c.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  partyCard: {
    flex: 1,
    backgroundColor: c.cardBg,
    borderWidth: 0.8,
    borderColor: c.border,
    borderRadius: 4,
    padding: 10,
  },
  partyRole: {
    fontSize: 9,
    fontWeight: 'bold',
    color: c.secondary,
    borderBottomWidth: 0.6,
    borderBottomColor: c.borderLight,
    paddingBottom: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  partyLine: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 3,
  },
  partyLineLabel: {
    fontWeight: 'bold',
    color: c.muted,
  },
  partyConclusion: {
    fontSize: 8,
    fontStyle: 'italic',
    color: c.muted,
    marginTop: 4,
  },

  partiesSummary: {
    fontSize: 8,
    color: c.muted,
    marginBottom: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Préambule et Articles
  sectionBlock: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: c.primary,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 0.6,
    borderBottomColor: c.borderLight,
  },
  articleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: c.primary,
    marginTop: 4,
    marginBottom: 4,
  },
  subArticleTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: c.secondary,
    marginTop: 5,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 5,
    textAlign: 'justify',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bullet: {
    width: 10,
    fontSize: 9,
    color: c.secondary,
  },
  listText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.35,
  },
  nestedList: {
    paddingLeft: 12,
    marginTop: 2,
    marginBottom: 4,
  },

  // Boîte de citation / mise en avant
  highlightBox: {
    backgroundColor: c.cardBg,
    borderLeftWidth: 2.5,
    borderLeftColor: c.secondary,
    padding: 7,
    marginVertical: 4,
  },
  highlightText: {
    fontSize: 8.5,
    color: c.text,
    fontWeight: 'medium',
  },

  // Zone Signatures
  signaturesContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  signaturesIntro: {
    fontSize: 9,
    fontWeight: 'medium',
    marginBottom: 10,
  },
  signaturesRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: c.border,
    borderRadius: 4,
    padding: 10,
    minHeight: 140,
    backgroundColor: '#ffffff',
  },
  signaturePartyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: c.primary,
    marginBottom: 4,
  },
  mentionManuscrite: {
    fontSize: 8,
    color: c.muted,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  signatureArea: {
    marginTop: 8,
    height: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImage: {
    maxHeight: 56,
    maxWidth: 150,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 8,
    color: '#a0a7a3',
  },

  // Annexe
  annexePage: {
    paddingTop: 52,
    paddingBottom: 50,
    paddingHorizontal: 44,
  },
  annexeHeader: {
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: c.primary,
    paddingBottom: 6,
  },
  annexeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: c.primary,
  },
  annexeNotice: {
    fontSize: 8.5,
    color: c.muted,
    marginTop: 3,
  },
  publicationsBox: {
    backgroundColor: c.cardBg,
    borderWidth: 0.8,
    borderColor: c.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  publicationLine: {
    fontSize: 8.5,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  annexeImageContainer: {
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: c.border,
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  annexeScreenshot: {
    maxHeight: 460,
    maxWidth: '100%',
    objectFit: 'contain',
  },
})

interface Props {
  data: ContratCessionData
}

export function ContratCession({ data }: Props) {
  const cleanInstagram = (data.auteurInstagram || '').replace(/^@+/, '').trim()
  const isGracieux = !data.remunerationType || data.remunerationType.includes('gracieux') || data.remunerationType.includes('gratuit')
  const dateStr = formatDate(data.dateSignature) || data.dateSignature
  const numContrat = data.numero ? `CTR-${data.numero}` : 'Brouillon'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête fixe */}
        <View fixed style={s.header}>
          <Text style={s.headerTitle}>Contrat de Cession de Droits d'Auteur</Text>
          <Text style={s.headerRef}>{numContrat}</Text>
        </View>

        {/* Pied de page fixe avec pagination et paraphe */}
        <View fixed style={s.footer}>
          <Text style={s.footerParaphe}>Paraphes : [   ] Auteur   /   [   ] Cessionnaire</Text>
          <Text
            style={s.footerPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* Bloc Titre */}
        <View style={s.titleSection}>
          <Text style={s.badge}>Propriété Intellectuelle</Text>
          <Text style={s.mainTitle}>CONTRAT DE CESSION DE DROITS D’AUTEUR SUR ŒUVRES PHOTOGRAPHIQUES</Text>
          <Text style={s.legalBasis}>
            Régie par les dispositions des articles L. 111-1 et suivants, L. 121-1 et suivants, et L. 131-1 et suivants
            du Code de la propriété intellectuelle (droit français)
          </Text>
        </View>

        {/* Parties */}
        <Text style={s.partiesHeader}>Entre les soussignés :</Text>
        <View style={s.partiesRow}>
          {/* L'Auteur */}
          <View style={s.partyCard}>
            <Text style={s.partyRole}>1. L’Auteur (Le Cédant)</Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Nom et prénom : </Text>
              {data.auteurNom || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Compte Instagram : </Text>
              {cleanInstagram ? `@${cleanInstagram}` : '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Adresse : </Text>
              {data.auteurAdresse || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Statut : </Text>
              {data.auteurStatut || 'Particulier'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>N° SIRET / Ordre : </Text>
              {data.auteurSiret || 'Sans objet'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Téléphone : </Text>
              {data.auteurTelephone || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>E-mail : </Text>
              {data.auteurEmail || '—'}
            </Text>
            <Text style={s.partyConclusion}>(Ci-après dénommé « L’Auteur »)</Text>
          </View>

          {/* Le Cessionnaire */}
          <View style={s.partyCard}>
            <Text style={s.partyRole}>2. Le Cessionnaire</Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Dénomination : </Text>
              {data.cessionnaireDenomination || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Forme juridique : </Text>
              {data.cessionnaireForme || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Capital social : </Text>
              {data.cessionnaireCapital || 'Sans objet'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Siège social : </Text>
              {data.cessionnaireAdresse || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Immatriculation : </Text>
              {data.cessionnaireRcs || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Représentée par : </Text>
              {data.cessionnaireRepresentant || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>Téléphone : </Text>
              {data.cessionnaireTelephone || '—'}
            </Text>
            <Text style={s.partyLine}>
              <Text style={s.partyLineLabel}>E-mail : </Text>
              {data.cessionnaireEmail || '—'}
            </Text>
            <Text style={s.partyConclusion}>(Ci-après dénommé « Le Cessionnaire »)</Text>
          </View>
        </View>

        <Text style={s.partiesSummary}>
          L’Auteur et le Cessionnaire étant ci-après individuellement dénommés « La Partie » et conjointement « Les Parties ».
        </Text>

        {/* Préambule */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionTitle}>PRÉAMBULE</Text>
          <Text style={s.paragraph}>
            1. L’Auteur déclare être le créateur exclusif, original et légitime titulaire des droits de propriété
            intellectuelle sur les œuvres photographiques diffusées sur son compte public du réseau social Instagram.
          </Text>
          <Text style={s.paragraph}>
            2. Le Cessionnaire édite et exploite un site internet professionnel accessible en ligne et souhaite y
            intégrer des photographies de l’Auteur afin d’en assurer l'illustration et l'ergonomie visuelle.
          </Text>
          <Text style={s.paragraph}>
            3. Conformément aux dispositions impératives de l’article L. 131-3 du Code de la propriété intellectuelle, la
            transmission des droits de l'auteur est subordonnée à la condition que chacun des droits cédés fasse l'objet d'une
            mention distincte dans l'acte de cession et que le domaine d'exploitation des droits cédés soit délimité quant à
            son étendue et à sa destination, quant au lieu et quant à la durée.
          </Text>
          <Text style={s.paragraph}>
            4. Conformément à l’article L. 131-1 du même Code, la cession globale des œuvres futures est formellement
            prohibée par la loi française. En conséquence, les Parties conviennent expressément que la présente convention
            est strictement bornée aux œuvres photographiques d'ores et déjà existantes et publiées sur le compte Instagram
            désigné ci-après à la date précise de signature des présentes.
          </Text>
        </View>

        {/* Article 1 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 1 – IDENTIFICATION ET DÉSIGNATION DES ŒUVRES VIA INSTAGRAM</Text>
          <Text style={s.paragraph}>
            Les œuvres photographiques faisant l'objet de la présente cession sont identifiées au travers du compte officiel
            Instagram de l'Auteur :
          </Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Identifiant du compte Instagram : <Text style={{ fontWeight: 'bold' }}>@{cleanInstagram}</Text>
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              URL du profil : <Text style={{ fontWeight: 'bold' }}>https://www.instagram.com/{cleanInstagram}/</Text>
            </Text>
          </View>
          <Text style={[s.paragraph, { marginTop: 4, fontWeight: 'medium' }]}>
            Périmètre des photographies cédées :
          </Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              <Text style={{ fontWeight: 'bold' }}>Sélection spécifique de publications / posts identifiés :</Text> La
              présente cession porte exclusivement sur les photographies correspondant aux publications Instagram listées
              par leurs URL spécifiques au sein de l'Annexe 1 du présent contrat.
            </Text>
          </View>
        </View>

        {/* Article 2 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 2 – NATURE ET ÉTENDUE DES DROITS CÉDÉS</Text>
          <Text style={s.paragraph}>
            L’Auteur cède au Cessionnaire, sous les garanties et conditions stipulées aux présentes, les droits
            patrimoniaux d’auteur strictement définis ci-après :
          </Text>

          <Text style={s.subArticleTitle}>2.1. Droit de reproduction numérique</Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Le droit de reproduire, télécharger, enregistrer, stocker et dupliquer les photographies visées à l'Article
              1 sur tout serveur informatique, hébergement cloud ou réseau de diffusion de contenu (CDN) administré pour le
              compte du Cessionnaire.
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Le droit de procéder aux adaptations strictement techniques exigées par l'environnement web : redimensionnement,
              recadrage proportionnel (affichage adapté aux ordinateurs, tablettes et smartphones) et compression de fichier,
              sous réserve de préserver la qualité esthétique fondamentale des œuvres.
            </Text>
          </View>

          <Text style={s.subArticleTitle}>2.2. Droit de représentation numérique</Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Le droit de communiquer, diffuser et afficher publiquement lesdites photographies en ligne sur le réseau
              Internet, exclusivement au sein des pages du site web désigné à l'Article 3.
            </Text>
          </View>

          <Text style={s.subArticleTitle}>2.3. Exclusions expresses</Text>
          <Text style={s.paragraph}>
            Tous les droits non expressément énumérés aux articles 2.1 et 2.2 demeurent la propriété exclusive de l’Auteur.
            Sont formellement exclus :
          </Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Toute reproduction sur support papier ou imprimé (brochures, affiches, flyers, presse, catalogues) ;
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Toute diffusion publicitaire d'achat d'espace (bannières payantes, Google Ads display, affichage programmatique)
              sans avenant écrit préalable ;
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Toute réutilisation des fichiers sur des produits ou services destinés à la revente directe (merchandising) ;
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              Toute sous-cession, licence secondaire ou mise à disposition à des tiers ou partenaires de la cliente.
            </Text>
          </View>
        </View>

        {/* Article 3 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 3 – DESTINATION ET SUPPORTS D’EXPLOITATION</Text>
          <Text style={s.paragraph}>
            La présente cession est consentie exclusivement pour la destination web suivante :
          </Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              <Text style={{ fontWeight: 'bold' }}>Support web autorisé :</Text> Site internet institutionnel ou commercial
              du Cessionnaire :
            </Text>
          </View>
          <View style={s.nestedList}>
            <Text style={s.paragraph}>
              - URL principale : <Text style={{ fontWeight: 'bold' }}>{data.siteUrlPrincipale || 'https://evasionlittorale.com'}</Text>
            </Text>
            {data.siteUrlSecondaire ? (
              <Text style={s.paragraph}>
                - URL secondaire : <Text style={{ fontWeight: 'bold' }}>{data.siteUrlSecondaire}</Text>
              </Text>
            ) : null}
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              <Text style={{ fontWeight: 'bold' }}>Finalité :</Text> Illustration visuelle éditoriale et mise en valeur
              de l'activité du Cessionnaire sur son site officiel.
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={s.listText}>
              <Text style={{ fontWeight: 'bold' }}>Mise à disposition technique :</Text> Le Cessionnaire se charge de
              récupérer directement les visuels sur le compte Instagram de l'Auteur, ce dernier restant libre, à sa
              convenance, de lui transmettre les fichiers originaux.
            </Text>
          </View>
        </View>

        {/* Article 4 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 4 – ZONE GÉOGRAPHIQUE (TERRITOIRE)</Text>
          <Text style={s.paragraph}>
            En raison du caractère mondial et décentralisé du réseau Internet et de la plateforme Instagram, l'autorisation
            de diffusion sur le site web du Cessionnaire est concédée pour le monde entier.
          </Text>
        </View>

        {/* Article 5 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 5 – DURÉE DU CONTRAT</Text>
          <Text style={s.paragraph}>
            La présente cession est accordée pour une durée ferme et déterminée de :
          </Text>
          <View style={s.highlightBox}>
            <Text style={s.highlightText}>
              {data.dureeAnnees || '5'} années ({data.dureeLettres || 'cinq'} ans) à compter de la date de signature des
              présentes.
            </Text>
          </View>
          <Text style={s.paragraph}>Au terme de cette durée :</Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>1.</Text>
            <Text style={s.listText}>
              L'autorisation d'exploitation prend fin de plein droit sans formalité judiciaire ni mise en demeure préalable.
            </Text>
          </View>
          <View style={s.listItem}>
            <Text style={s.bullet}>2.</Text>
            <Text style={s.listText}>
              Le Cessionnaire s'engage à retirer l'ensemble des photographies de son site internet et de ses serveurs publics,
              sauf signature d'un avenant écrit de renouvellement convenu entre les Parties.
            </Text>
          </View>
        </View>

        {/* Article 6 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 6 – RÉMUNÉRATION DE LA CESSION</Text>
          <Text style={s.paragraph}>
            Conformément à l’article L. 131-4, alinéa 2 du Code de la propriété intellectuelle, les Parties constatent
            l’impossibilité pratique de baser la rémunération sur une recette proportionnelle liée à la simple visite d'un
            site web informatif ou marchand. En conséquence, les Parties conviennent expressément d’opter pour l’option
            ci-dessous :
          </Text>
          <View style={s.highlightBox}>
            {isGracieux ? (
              <Text style={s.highlightText}>
                [X] Cession consentie à titre gracieux : La présente cession est consentie à titre gratuit. L’Auteur déclare
                expressément et en toute connaissance de cause renoncer à toute indemnité ou contrepartie financière pour les
                exploitations strictement prévues au présent contrat.
              </Text>
            ) : (
              <Text style={s.highlightText}>
                [X] Rémunération forfaitaire : La présente cession est consentie moyennant le versement d'une rémunération
                forfaitaire et définitive de {data.remunerationMontant || '250 € HT'}, payable sous 30 jours à compter de la
                signature des présentes.
              </Text>
            )}
          </View>
        </View>

        {/* Article 7 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 7 – DROIT MORAL ET OBLIGATION DE PATERNITÉ (CRÉDITS)</Text>
          <Text style={s.paragraph}>
            Conformément aux dispositions de l’article L. 121-1 du Code de la propriété intellectuelle, le droit moral de
            l'Auteur est inaliénable, perpétuel et imprescriptible.
          </Text>
          <Text style={s.subArticleTitle}>1. Obligation de crédit / mention de paternité :</Text>
          <Text style={s.paragraph}>
            Le Cessionnaire s'engage de façon impérative à faire figurer la mention de paternité suivante lors de
            l'exploitation de chaque image :
          </Text>
          <View style={s.highlightBox}>
            <Text style={[s.highlightText, { textAlign: 'center', fontWeight: 'bold' }]}>
              « © {data.auteurNom || "Nom de l'Auteur"} / Instagram : @{cleanInstagram || 'compte_instagram'} »
            </Text>
          </View>
          <Text style={s.paragraph}>
            Cette mention doit apparaître soit à proximité immédiate de chaque photographie, soit sur une page « Crédits
            photographiques / Mentions légales » directement accessible via un lien hypertexte visible sur l'ensemble des
            pages du site web.
          </Text>
          <Text style={s.subArticleTitle}>2. Respect de l'intégrité de l'œuvre :</Text>
          <Text style={s.paragraph}>
            Le Cessionnaire s'engage à ne pas dénaturer les photographies (interdiction de montages trompeurs, de filtres
            altérant substantiellement la colorimétrie ou d'associations à des contextes dégradants ou contraires aux bonnes
            mœurs).
          </Text>
        </View>

        {/* Article 8 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 8 – GARANTIES STRICTES LIÉES AU COMPTE INSTAGRAM ET AUX TIERS</Text>
          <Text style={s.subArticleTitle}>1. Titularité personnelle de l'Auteur :</Text>
          <Text style={s.paragraph}>
            L'Auteur garantit formellement au Cessionnaire qu'il est l'auteur unique et exclusif de l'ensemble des
            photographies publiées sur son compte Instagram visé à l'Article 1, qu'il ne s'agit en aucun cas de
            republications (reposts), de captures ou d'œuvres dérivées de tiers, et que les œuvres sont libres de tout gage,
            saisie ou droit revendiqué par un tiers.
          </Text>
          <Text style={s.subArticleTitle}>2. Droit à l'image des personnes et des biens privés :</Text>
          <View style={s.listItem}>
            <Text style={s.bullet}>[X]</Text>
            <Text style={s.listText}>
              {data.garantieDroitImage && data.garantieDroitImage.startsWith('Non') ? (
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>Mention expresse :</Text> Les photographies cédées représentent
                  exclusivement des paysages naturels et éléments de lieux publics ne nécessitant aucune autorisation
                  relative au droit à l'image des personnes ou des biens privés.
                </Text>
              ) : (
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>Garantie de l'Auteur :</Text> L’Auteur garantit détenir les
                  autorisations écrites et régulières de fixation et de diffusion de l'image de toutes les personnes physiques
                  identifiables ainsi que des éléments de propriété privée figurant sur les photographies de son compte
                  Instagram.
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Article 9 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 9 – RÉSILIATION ET FIN DE CONTRAT</Text>
          <Text style={s.paragraph}>
            En cas de manquement grave par l'une des Parties à l'une de ses obligations contractuelles (notamment le défaut
            de paiement du forfait ou la suppression récurrente des crédits d'auteur obligatoires), et trente (30) jours après
            une mise en demeure par lettre recommandée avec accusé de réception demeurée sans effet, le présent contrat sera
            résilié de plein droit.
          </Text>
          <Text style={s.paragraph}>
            Le Cessionnaire devra alors retirer sans délai les photographies litigieuses de son site web.
          </Text>
        </View>

        {/* Article 10 */}
        <View style={s.sectionBlock}>
          <Text style={s.articleTitle}>ARTICLE 10 – DROIT APPLICABLE ET ATTRIBUTION DE JURIDICTION</Text>
          <Text style={s.paragraph}>
            Le présent contrat est exclusivement régi et interprété conformément au droit français.
          </Text>
          <Text style={s.paragraph}>
            Les Parties s'engagent à rechercher une solution amiable à tout différend relatif à la validité, l'interprétation
            ou l'exécution du présent contrat. À défaut d'accord amiable, tout litige sera porté devant les tribunaux
            compétents.
          </Text>
        </View>

        {/* Signatures des Parties (wrap={false} pour éviter coupure de page) */}
        <View wrap={false} style={s.signaturesContainer}>
          <Text style={s.signaturesIntro}>
            Fait à <Text style={{ fontWeight: 'bold' }}>{data.villeSignature || 'Venansault'}</Text>, le{' '}
            <Text style={{ fontWeight: 'bold' }}>{dateStr}</Text>, en{' '}
            <Text style={{ fontWeight: 'bold' }}>deux (2)</Text> exemplaires originaux, chacune des Parties reconnaissant en
            avoir reçu un.
          </Text>
          <Text style={[s.mentionManuscrite, { marginBottom: 8 }]}>
            (Faire précéder chaque signature de la mention manuscrite correspondante)
          </Text>

          <View style={s.signaturesRow}>
            {/* Signature Auteur */}
            <View style={s.signatureBox}>
              <Text style={s.signaturePartyTitle}>POUR L’AUTEUR (LE CÉDANT) :</Text>
              <Text style={s.partyLine}>
                <Text style={s.partyLineLabel}>Nom et Prénom : </Text>
                {data.auteurNom || '—'}
              </Text>
              <Text style={s.mentionManuscrite}>
                Mention manuscrite obligatoire : « Bon pour accord et cession de droits »
              </Text>
              <Text style={s.partyLine}>
                <Text style={s.partyLineLabel}>Date : </Text>
                {dateStr}
              </Text>

              <View style={s.signatureArea}>
                {data.auteurSignature ? (
                  <Image style={s.signatureImage} src={data.auteurSignature} />
                ) : (
                  <Text style={s.signaturePlaceholder}>Signature</Text>
                )}
              </View>
            </View>

            {/* Signature Cessionnaire */}
            <View style={s.signatureBox}>
              <Text style={s.signaturePartyTitle}>POUR LE CESSIONNAIRE :</Text>
              <Text style={s.partyLine}>
                <Text style={s.partyLineLabel}>Dénomination : </Text>
                {data.cessionnaireDenomination || '—'}
              </Text>
              <Text style={s.partyLine}>
                <Text style={s.partyLineLabel}>Signataire : </Text>
                {data.cessionnaireRepresentant || '—'}
              </Text>
              <Text style={s.mentionManuscrite}>
                Mention manuscrite obligatoire : « Bon pour accord et acceptation de cession »
              </Text>
              <Text style={s.partyLine}>
                <Text style={s.partyLineLabel}>Date : </Text>
                {dateStr}
              </Text>

              <View style={s.signatureArea}>
                {data.cessionnaireSignature ? (
                  <Image style={s.signatureImage} src={data.cessionnaireSignature} />
                ) : (
                  <Text style={s.signaturePlaceholder}>Signature et cachet de l'entreprise</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ANNEXE 1 – Sur une page distincte (break) */}
        <View break style={s.annexePage}>
          <View style={s.annexeHeader}>
            <Text style={s.badge}>Annexe Contractuelle</Text>
            <Text style={s.annexeTitle}>ANNEXE 1 – RELEVÉ DES ŒUVRES CÉDÉES</Text>
            <Text style={s.annexeNotice}>
              (Relevé des photographies cédées issues du compte officiel Instagram @{cleanInstagram || 'auteur'} à la date
              de signature des présentes).
            </Text>
          </View>

          {/* Liste des publications */}
          <View style={s.publicationsBox}>
            <Text style={[s.partyRole, { marginBottom: 8 }]}>Publications Instagram faisant l'objet de la cession :</Text>
            {data.annexePublications ? (
              data.annexePublications.split('\n').filter(Boolean).map((line, idx) => (
                <View key={idx} style={s.listItem}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.listText}>{line}</Text>
                </View>
              ))
            ) : (
              <Text style={s.publicationLine}>Aucune publication spécifique mentionnée.</Text>
            )}
          </View>

          {/* Capture d'écran éventuelle du fil Instagram */}
          {data.annexeImage ? (
            <View style={s.annexeImageContainer}>
              <Text style={[s.partyLineLabel, { marginBottom: 6 }]}>Capture d'écran horodatée du fil Instagram :</Text>
              <Image style={s.annexeScreenshot} src={data.annexeImage} />
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
