import { next } from '@vercel/functions'

/**
 * Type de process.env déclaré ici plutôt que via @types/node : Vercel vérifie ce fichier à part
 * et n'y trouve pas les types Node. On garde l'accès littéral process.env.X, que Vercel remplace
 * par la valeur au build.
 */
declare const process: { env: Record<string, string | undefined> }

/**
 * Protège l'espace de gestion et de configuration par un mot de passe (HTTP Basic Auth),
 * tout en laissant un accès 100% public et libre au lien de signature envoyé au photographe
 * (/signer, /api/contracts/sign, assets, polices).
 *
 * Variables d'environnement Vercel :
 * - SITE_PASSWORD (recommandé pour verrouiller l'administration)
 * - SITE_USER (facultatif, ex: "admin")
 */
export default function middleware(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname

  // 1. Accès public pour la signature à distance et les ressources statiques
  const isPublicRoute =
    path.startsWith('/signer') ||
    path.startsWith('/api/contracts/sign') ||
    path.startsWith('/api/contracts/status') ||
    path.startsWith('/assets/') ||
    path.startsWith('/fonts/') ||
    path === '/favicon.ico' ||
    path === '/robots.txt'

  if (isPublicRoute) {
    return next()
  }

  // 2. Vérification du Basic Auth pour l'espace d'administration et de configuration
  const password = process.env.SITE_PASSWORD
  if (!password) {
    // Si aucun mot de passe n'est encore configuré dans Vercel, on autorise l'accès
    // pour éviter de bloquer l'application en cours de configuration.
    return next()
  }

  const [user, pass] = decodeBasicAuth(request.headers.get('authorization'))
  const expectedUser = process.env.SITE_USER
  const userOk = !expectedUser || safeEqual(user, expectedUser)

  if (userOk && safeEqual(pass, password)) {
    return next()
  }

  return new Response('Accès protégé — Make Contrat.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Make Contrat - Administration", charset="UTF-8"',
    },
  })
}

function decodeBasicAuth(header: string | null): [string, string] {
  if (!header?.startsWith('Basic ')) return ['', '']
  try {
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6)), (ch) => ch.charCodeAt(0)))
    const sep = decoded.indexOf(':')
    return sep < 0 ? ['', ''] : [decoded.slice(0, sep), decoded.slice(sep + 1)]
  } catch {
    return ['', '']
  }
}

/** Comparaison en temps constant, pour ne pas laisser deviner le mot de passe au chronomètre. */
function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}
