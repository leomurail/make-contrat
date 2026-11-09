import { Font } from '@react-pdf/renderer'
import bold from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Bold.ttf'
import medium from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Medium.ttf'
import regular from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Regular.ttf'
import caveatSemiBold from '../assets/fonts/caveat/Caveat-SemiBold.ttf'

/** Police de la charte graphique (ITF Free Font License : intégration PDF autorisée). */
export const BRAND_FONT = 'Cabinet Grotesk'

/** Police manuscrite pour les mentions « Lu et approuvé » (SIL Open Font License). */
export const HANDWRITING_FONT = 'Caveat'

Font.register({
  family: BRAND_FONT,
  fonts: [
    { src: regular, fontWeight: 400 },
    { src: regular, fontWeight: 400, fontStyle: 'italic' },
    { src: medium, fontWeight: 500 },
    { src: bold, fontWeight: 700 },
    { src: bold, fontWeight: 700, fontStyle: 'italic' },
  ],
})

Font.register({
  family: HANDWRITING_FONT,
  fonts: [
    { src: caveatSemiBold, fontWeight: 400 },
    { src: caveatSemiBold, fontWeight: 600 },
    { src: caveatSemiBold, fontWeight: 'normal' },
    { src: caveatSemiBold, fontWeight: 'bold' },
  ],
})

// Pas de césure automatique (les règles par défaut sont anglaises).
Font.registerHyphenationCallback((word) => [word])

