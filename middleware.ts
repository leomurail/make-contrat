import { next } from '@vercel/functions'

/**
 * Type de process.env déclaré ici plutôt que via @types/node : Vercel vérifie ce fichier à part
 * et n'y trouve pas les types Node. On garde l'accès littéral process.env.X, que Vercel remplace
 * par la valeur au build.
 */
declare const process: { env: Record<string, string | undefined> }

/**
 * Protège tout le site (pages, polices, images) par un mot de passe, via l'authentification
 * HTTP du navigateur. Exécuté par Vercel avant chaque requête.
 *
 * Variables d'environnement Vercel :
 * - SITE_PASSWORD (obligatoire) : sans elle, le site reste fermé.
 * - SITE_USER (facultatif) : identifiant attendu ; n'importe lequel s'il est absent.
 */
export default function middleware(request: Request) {
  const password = process.env.SITE_PASSWORD
  if (!password) {
    return new Response('Accès fermé : mot de passe non configuré (SITE_PASSWORD).', { status: 503 })
  }

  const [user, pass] = decodeBasicAuth(request.headers.get('authorization'))
  const expectedUser = process.env.SITE_USER
  const userOk = !expectedUser || safeEqual(user, expectedUser)

  if (userOk && safeEqual(pass, password)) return next()

  return new Response('Accès protégé.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Make Doc", charset="UTF-8"' },
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
