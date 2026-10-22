import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

/**
 * Les modèles sont rendus par react-pdf, que le fast refresh de React ne met pas à jour :
 * sans rechargement complet, l'aperçu et l'export garderaient l'ancienne mise en page.
 * (Le brouillon et l'historique survivent au rechargement.)
 */
function reloadOnTemplateChange(): Plugin {
  return {
    name: 'reload-on-template-change',
    hotUpdate({ file }) {
      if (file.includes('/src/templates/')) {
        this.environment.hot.send({ type: 'full-reload' })
        return []
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    reloadOnTemplateChange(),
    // Les Safari / iPad d'avant 2022 n'ont pas .at(), Object.hasOwn… utilisés par react-pdf :
    // sans ces polyfills, l'app s'affiche un instant puis plante (page blanche).
    legacy({ targets: ['defaults', 'safari >= 12', 'ios >= 12'], modernPolyfills: true }),
  ],
})
