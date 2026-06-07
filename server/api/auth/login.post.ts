import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import type { AuthResponse } from '#shared/types'
import { users } from '../../database/schema'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const { email, password } = await readBody<{ email?: string; password?: string }>(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const db = useDb()
  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash)
  if (!validPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const { jwtSecret } = useRuntimeConfig()
  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '365d' })

  await db
    .update(users)
    .set({ apiToken: token, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return { token, user: { id: user.id, email: user.email } }
})
