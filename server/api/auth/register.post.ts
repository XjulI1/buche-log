import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import type { AuthResponse } from '#shared/types'
import { users } from '../../database/schema'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const { email, password } = await readBody<{ email?: string; password?: string }>(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
  }

  const db = useDb()
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Email already registered' })
  }

  const id = uuidv4()
  const passwordHash = await bcrypt.hash(password, 10)
  const { jwtSecret } = useRuntimeConfig()
  const token = jwt.sign({ userId: id }, jwtSecret, { expiresIn: '365d' })
  const now = new Date()

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    apiToken: token,
    createdAt: now,
    updatedAt: now,
  })

  setResponseStatus(event, 201)
  return { token, user: { id, email } }
})
