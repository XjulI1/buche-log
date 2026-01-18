import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'
import { RowDataPacket } from 'mysql2'

export interface AuthRequest extends Request {
  userId?: string
  user?: { id: string; email: string }
}

interface UserRow extends RowDataPacket {
  id: string
  email: string
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.substring(7)

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
    }

    const users = await query<UserRow[]>(
      'SELECT id, email FROM users WHERE id = ?',
      [decoded.userId],
    )

    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.userId = decoded.userId
    req.user = users[0]
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
