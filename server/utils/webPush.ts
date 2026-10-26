import { createPrivateKey, sign } from 'node:crypto'

export interface VapidKeys {
  publicKey: string // point P-256 non compresse (65 octets), base64url
  privateKey: string // scalaire d (32 octets), base64url
  subject: string // mailto:... ou https://...
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

/**
 * En-tete Authorization VAPID (RFC 8292) : JWT ES256 signe avec la cle privee.
 */
export function createVapidAuthorization(
  endpoint: string,
  keys: VapidKeys,
  now: Date = new Date(),
): string {
  const header = base64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const claims = base64url(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(now.getTime() / 1000) + 12 * 3600,
      sub: keys.subject,
    }),
  )

  const publicPoint = Buffer.from(keys.publicKey, 'base64url')
  const key = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: keys.privateKey,
      x: base64url(publicPoint.subarray(1, 33)),
      y: base64url(publicPoint.subarray(33, 65)),
    },
    format: 'jwk',
  })
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), {
    key,
    dsaEncoding: 'ieee-p1363',
  })

  return `vapid t=${header}.${claims}.${base64url(signature)}, k=${keys.publicKey}`
}

/**
 * Envoie une notification push sans contenu : le service worker affiche un
 * message fixe. Evite le chiffrement du payload (RFC 8291).
 * Retourne le code HTTP du service push (201 = ok, 404/410 = abonnement expire).
 */
export async function sendEmptyPush(endpoint: string, keys: VapidKeys): Promise<number> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: createVapidAuthorization(endpoint, keys),
      TTL: String(24 * 3600),
      Urgency: 'normal',
      'Content-Length': '0',
    },
  })
  return response.status
}

export function useVapidKeys(): VapidKeys | null {
  const config = useRuntimeConfig()
  const publicKey = config.public.vapidPublicKey
  if (!publicKey || !config.vapidPrivateKey || !config.vapidSubject) return null
  return { publicKey, privateKey: config.vapidPrivateKey, subject: config.vapidSubject }
}
