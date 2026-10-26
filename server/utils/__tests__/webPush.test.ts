// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto'
import { createVapidAuthorization } from '../webPush'

function generateKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const pub = publicKey.export({ format: 'jwk' })
  const point = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(pub.x!, 'base64url'),
    Buffer.from(pub.y!, 'base64url'),
  ])
  return {
    publicKey: point.toString('base64url'),
    privateKey: privateKey.export({ format: 'jwk' }).d!,
    subject: 'mailto:test@example.com',
    jwk: pub,
  }
}

describe('createVapidAuthorization', () => {
  it('produces a valid ES256 JWT for the push service origin', () => {
    const keys = generateKeys()
    const now = new Date('2026-10-26T12:00:00Z')
    const header = createVapidAuthorization('https://push.example.com/send/abc', keys, now)

    const match = header.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/)
    expect(match).not.toBeNull()
    const [, h, c, s, k] = match!
    expect(k).toBe(keys.publicKey)

    const claims = JSON.parse(Buffer.from(c!, 'base64url').toString())
    expect(claims).toEqual({
      aud: 'https://push.example.com',
      exp: now.getTime() / 1000 + 12 * 3600,
      sub: 'mailto:test@example.com',
    })

    const valid = verify(
      'sha256',
      Buffer.from(`${h}.${c}`),
      { key: createPublicKey({ key: keys.jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' },
      Buffer.from(s!, 'base64url'),
    )
    expect(valid).toBe(true)
  })
})
