import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { users } from '../database/schema'

export interface AuthUser {
  id: string
  email: string
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const header = getHeader(event, 'authorization')

  if (!header?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'No token provided' })
  }

  const { jwtSecret } = useRuntimeConfig()
  const token = header.slice(7)

  let decoded: { userId: string }
  try {
    decoded = jwt.verify(token, jwtSecret) as { userId: string }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const db = useDb()
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  event.context.user = user
  return user
}
