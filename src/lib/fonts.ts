import { Font } from '@react-pdf/renderer'
import bold from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Bold.ttf'
import medium from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Medium.ttf'
import regular from '../assets/fonts/cabinet-grotesk/CabinetGrotesk-Regular.ttf'

/** Police de la charte graphique (ITF Free Font License : intégration PDF autorisée). */
export const BRAND_FONT = 'Cabinet Grotesk'

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

// Pas de césure automatique (les règles par défaut sont anglaises).
Font.registerHyphenationCallback((word) => [word])
