import { Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth.js'
import { query, execute } from '../config/database.js'
import type { ConsumptionRow } from '../types/index.js'
import { consumptionRowToApi } from '../types/index.js'
import { RowDataPacket } from 'mysql2'

interface DbConsumptionRow extends RowDataPacket, ConsumptionRow {}

export async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rows = await query<DbConsumptionRow[]>(
      'SELECT * FROM consumptions WHERE user_id = ? AND deleted_at IS NULL ORDER BY date DESC, created_at DESC',
      [req.userId],
    )
    res.json(rows.map(consumptionRowToApi))
  } catch (error) {
    next(error)
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rows = await query<DbConsumptionRow[]>(
      'SELECT * FROM consumptions WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Consumption not found' })
      return
    }

    res.json(consumptionRowToApi(rows[0]))
  } catch (error) {
    next(error)
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { rackId, type, percentage, date, weekNumber, year, notes } = req.body
    const id = req.body.id || uuidv4()
    const now = new Date()

    await execute(
      `INSERT INTO consumptions (id, user_id, rack_id, type, percentage, date,
       week_number, year, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, rackId, type, percentage, new Date(date), weekNumber, year, notes || null, now, now],
    )

    const rows = await query<DbConsumptionRow[]>('SELECT * FROM consumptions WHERE id = ?', [id])
    res.status(201).json(consumptionRowToApi(rows[0]))
  } catch (error) {
    next(error)
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { type, percentage, date, weekNumber, year, notes } = req.body

    const existing = await query<DbConsumptionRow[]>(
      'SELECT * FROM consumptions WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (existing.length === 0) {
      res.status(404).json({ error: 'Consumption not found' })
      return
    }

    await execute(
      `UPDATE consumptions SET type = ?, percentage = ?, date = ?,
       week_number = ?, year = ?, notes = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [type, percentage, new Date(date), weekNumber, year, notes || null, req.params.id, req.userId],
    )

    const rows = await query<DbConsumptionRow[]>('SELECT * FROM consumptions WHERE id = ?', [
      req.params.id,
    ])
    res.json(consumptionRowToApi(rows[0]))
  } catch (error) {
    next(error)
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const existing = await query<DbConsumptionRow[]>(
      'SELECT * FROM consumptions WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (existing.length === 0) {
      res.status(404).json({ error: 'Consumption not found' })
      return
    }

    // Soft delete
    await execute(
      'UPDATE consumptions SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId],
    )

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
