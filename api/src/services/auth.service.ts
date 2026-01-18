import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { query, execute } from '../config/database.js'
import { RowDataPacket } from 'mysql2'

interface UserRow extends RowDataPacket {
  id: string
  email: string
  password_hash: string
}

export async function register(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string } }> {
  // Check if user already exists
  const existing = await query<UserRow[]>(
    'SELECT id FROM users WHERE email = ?',
    [email],
  )

  if (existing.length > 0) {
    const error = new Error('Email already registered') as Error & {
      statusCode: number
    }
    error.statusCode = 400
    throw error
  }

  const id = uuidv4()
  const passwordHash = await bcrypt.hash(password, 10)
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET!, {
    expiresIn: '365d',
  })

  await execute(
    `INSERT INTO users (id, email, password_hash, api_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [id, email, passwordHash, token],
  )

  return {
    token,
    user: { id, email },
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string } }> {
  const users = await query<UserRow[]>(
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email],
  )

  if (users.length === 0) {
    const error = new Error('Invalid credentials') as Error & {
      statusCode: number
    }
    error.statusCode = 401
    throw error
  }

  const user = users[0]
  const validPassword = await bcrypt.compare(password, user.password_hash)

  if (!validPassword) {
    const error = new Error('Invalid credentials') as Error & {
      statusCode: number
    }
    error.statusCode = 401
    throw error
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '365d',
  })

  // Update stored token
  await execute('UPDATE users SET api_token = ?, updated_at = NOW() WHERE id = ?', [
    token,
    user.id,
  ])

  return {
    token,
    user: { id: user.id, email: user.email },
  }
}

export async function getCurrentUser(
  userId: string,
): Promise<{ id: string; email: string }> {
  const users = await query<UserRow[]>(
    'SELECT id, email FROM users WHERE id = ?',
    [userId],
  )

  if (users.length === 0) {
    const error = new Error('User not found') as Error & { statusCode: number }
    error.statusCode = 404
    throw error
  }

  return { id: users[0].id, email: users[0].email }
}
