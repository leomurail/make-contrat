# Make Contrat

Générateur et gestionnaire de contrats juridiques et de cessions de droits : on remplit un formulaire, l'aperçu PDF se met à jour en direct, puis on **émet** le contrat avec son numéro d'enregistrement. Le contrat est généré au format PDF vectoriel et archivé localement dans l'historique.

Modèle initialement intégré : **Contrat de cession de droits d'auteur sur œuvres photographiques (Instagram / Web)** conforme au Code de la propriété intellectuelle français (L. 111-1+, L. 121-1+, L. 131-1+).

**Stack** : Vite + React 19 + TypeScript + [`@react-pdf/renderer`](https://react-pdf.org) + [Dexie](https://dexie.org) (IndexedDB).

- **Aperçu réactif & Export vectoriel** : le même composant React génère la prévisualisation et l'export PDF imprimable ou signable, sans pixellisation.
- **Zéro serveur & Confidentialité totale** : les contrats, identifiants des parties et données sensibles restent 100% dans le navigateur de l'ordinateur.
- **Gestion des annexes & captures** : saisie des publications cédées et inclusion directe d'une capture d'écran horodatée du compte Instagram.

## Démarrer

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # typecheck + build de production dans dist/
```

## Fonctionnalités

| | |
|---|---|
| **Contrat sur-mesure** | Adaptation instantanée de l'Auteur (Cédant), du Cessionnaire (Société / EI / Représentant), des URL web autorisées, de la durée en années, du type de rémunération (gracieuse ou forfaitaire) et des garanties de droit à l'image. |
| **Numérotation** | Numérotation assistée par année (ex : `2026-001` pour le contrat 1 de 2026). Le formulaire indique automatiquement le dernier numéro émis. |
| **Signatures & Cachets** | Import des signatures manuscrites et cachets d'entreprise sous format image, avec mentions obligatoires pré-remplies. |
| **Annexe 1 intégrée** | Relevé des URLs Instagram et descriptions sur page dédiée avec capture d'écran horodatée. |
| **Historique & Duplication** | Retrouver un contrat émis, retélécharger le PDF ou dupliquer un modèle pour un nouvel auteur. |
| **Sauvegarde / Restauration** | Export JSON intégral de tous les contrats et signatures pour archivage externe sécurisé. |

## Structure du projet

```
src/
  lib/types.ts                      # Définition des champs et des modèles
  lib/db.ts                         # Base locale Dexie (IndexedDB)
  lib/archive.ts                    # Numérotation, archivage, export/import
  components/DocForm.tsx            # Formulaire dynamique groupé
  components/History.tsx            # Historique des contrats émis
  components/PdfPreview.tsx         # Rendu temps réel via @react-pdf/renderer
  templates/
    index.ts                        # Registre des modèles de contrats
    cession-droits-auteur/          # Contrat de cession de droits d'auteur (Instagram / Web)
      types.ts                      # Structure des données du contrat
      index.ts                      # Définition des groupes et valeurs par défaut
      ContratCession.tsx            # Mise en page du contrat A4 paginé
```
