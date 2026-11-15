# Sécurité — Make Contrat

## Contrôle d'accès et authentification
- L'espace d'administration (`/`, `/api/contracts/share`, `/api/contracts/status`) est protégé par HTTP Basic Auth via `middleware.ts` (`SITE_USER` / `SITE_PASSWORD`), avec comportement **fail-closed** (`503` si `SITE_PASSWORD` est absent).
- L'espace de signature externe (`/signer`, `/api/contracts/sign`) est accessible uniquement via un jeton UUID v4 (`crypto.randomUUID()`, 122 bits d'entropie), valable 14 jours avant signature et ramené à 48 heures après signature.

## Règles de validation des entrées
- **Jetons (`token`)** : format UUID v4 strict vérifié côté serveur avant toute lecture/écriture Redis.
- **Partage (`/api/contracts/share`)** : corps JSON limité à 5 Mo réels ; `data` doit être un objet plat `Record<string, string>` (≤ 60 clés sûres, pas de pollution de prototype) ; toute image en `data:` doit être `image/png`, `image/jpeg` ou `image/webp` encodée en base64.
- **Signature (`/api/contracts/sign`)** : corps limité à 2 Mo ; `auteurLuApprouve === true` obligatoire ; `signerName` entre 2 et 150 caractères ; `auteurSignature` au format `data:image/(png|jpeg);base64,...` (≤ 1,5 Mo).
- **Uploads côté client (`DocForm`, `ContractsDashboard`)** : images limitées à 10 Mo avant ré-encodage systématique sur `<canvas>` (suppression des métadonnées EXIF et rejet des fichiers corrompus) ; sauvegardes JSON limitées à 10 Mo et validées structurellement.
- **Anti-CSRF** : vérification `Sec-Fetch-Site !== 'cross-site'`, contrôle `Origin` vs `Host`, et exigence `Content-Type: application/json` sur les `POST`.

## Maintenance des dépendances
- Vérification des vulnérabilités avant chaque déploiement (`pnpm audit` / Trivy).
- Délais cibles de remédiation :
  - **Critique / Bloquant** : sous 48 h
  - **Élevé / Majeur** : sous 7 jours
  - **Modéré / Mineur** : sous 30 jours
