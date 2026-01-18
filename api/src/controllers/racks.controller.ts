import { Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth.js'
import { query, execute } from '../config/database.js'
import type { RackRow } from '../types/index.js'
import { rackRowToApi } from '../types/index.js'
import { RowDataPacket } from 'mysql2'

interface DbRackRow extends RowDataPacket, RackRow {}

export async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rows = await query<DbRackRow[]>(
      'SELECT * FROM racks WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at',
      [req.userId],
    )
    res.json(rows.map(rackRowToApi))
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
    const rows = await query<DbRackRow[]>(
      'SELECT * FROM racks WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Rack not found' })
      return
    }

    res.json(rackRowToApi(rows[0]))
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
    const { name, height, width, depth, logSize, volumeM3, volumeSteres } = req.body
    const id = req.body.id || uuidv4()
    const now = new Date()

    await execute(
      `INSERT INTO racks (id, user_id, name, height, width, depth, log_size,
       volume_m3, volume_steres, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, name, height, width, depth, logSize, volumeM3, volumeSteres, now, now],
    )

    const rows = await query<DbRackRow[]>('SELECT * FROM racks WHERE id = ?', [id])
    res.status(201).json(rackRowToApi(rows[0]))
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
    const { name, height, width, depth, logSize, volumeM3, volumeSteres } = req.body

    const existing = await query<DbRackRow[]>(
      'SELECT * FROM racks WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (existing.length === 0) {
      res.status(404).json({ error: 'Rack not found' })
      return
    }

    await execute(
      `UPDATE racks SET name = ?, height = ?, width = ?, depth = ?,
       log_size = ?, volume_m3 = ?, volume_steres = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, height, width, depth, logSize, volumeM3, volumeSteres, req.params.id, req.userId],
    )

    const rows = await query<DbRackRow[]>('SELECT * FROM racks WHERE id = ?', [req.params.id])
    res.json(rackRowToApi(rows[0]))
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
    const existing = await query<DbRackRow[]>(
      'SELECT * FROM racks WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [req.params.id, req.userId],
    )

    if (existing.length === 0) {
      res.status(404).json({ error: 'Rack not found' })
      return
    }

    // Soft delete
    await execute(
      'UPDATE racks SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId],
    )

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
