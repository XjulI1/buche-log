import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service.js'
import { AuthRequest } from '../middleware/auth.js'

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    const result = await authService.register(email, password)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const result = await authService.login(email, password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function me(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.userId!)
    res.json(user)
  } catch (error) {
    next(error)
  }
}
