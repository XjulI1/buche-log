// Genere une paire de cles VAPID (P-256) pour les notifications Web Push.
import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const pub = publicKey.export({ format: 'jwk' })
const priv = privateKey.export({ format: 'jwk' })

const point = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pub.x, 'base64url'),
  Buffer.from(pub.y, 'base64url'),
])

console.log(`NUXT_PUBLIC_VAPID_PUBLIC_KEY=${point.toString('base64url')}`)
console.log(`NUXT_VAPID_PRIVATE_KEY=${priv.d}`)
console.log('NUXT_VAPID_SUBJECT=mailto:vous@example.com')
