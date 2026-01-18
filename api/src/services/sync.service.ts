import { query, execute } from '../config/database.js'
import type {
  SyncItem,
  Rack,
  ConsumptionEntry,
  ConflictResolution,
  RackRow,
  ConsumptionRow,
} from '../types/index.js'
import { rackRowToApi, consumptionRowToApi } from '../types/index.js'
import { RowDataPacket } from 'mysql2'

interface DbRackRow extends RowDataPacket, RackRow {}
interface DbConsumptionRow extends RowDataPacket, ConsumptionRow {}

interface ProcessResult<T> {
  created: T[]
  updated: T[]
  deleted: string[]
  conflicts: ConflictResolution[]
}

export async function processRacks(
  userId: string,
  items: SyncItem<Rack>[],
): Promise<ProcessResult<Rack>> {
  const results: ProcessResult<Rack> = {
    created: [],
    updated: [],
    deleted: [],
    conflicts: [],
  }

  for (const item of items) {
    const { data, action, localUpdatedAt } = item

    if (action === 'create') {
      const existing = await query<DbRackRow[]>(
        'SELECT * FROM racks WHERE id = ? AND user_id = ?',
        [data.id, userId],
      )
      console.log([
        data.id,
        userId,
        data.name,
        data.height,
        data.width,
        data.depth,
        data.logSize,
        data.volumeM3,
        data.volumeSteres,
        new Date(data.createdAt),
        new Date(localUpdatedAt),
        data.deletedAt ? new Date(data.deletedAt) : null,
      ])
      if (existing.length === 0) {
        await execute(
          `INSERT INTO racks (id, user_id, name, height, width, depth, log_size,
           volume_m3, volume_steres, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.id,
            userId,
            data.name,
            data.height,
            data.width,
            data.depth,
            data.logSize + '',
            data.volumeM3,
            data.volumeSteres,
            new Date(data.createdAt),
            new Date(localUpdatedAt),
            data.deletedAt ? new Date(data.deletedAt) : null,
          ],
        )
        results.created.push(data)
      }
    } else if (action === 'update' || action === 'delete') {
      const existing = await query<DbRackRow[]>(
        'SELECT * FROM racks WHERE id = ? AND user_id = ?',
        [data.id, userId],
      )

      if (existing.length > 0) {
        const serverUpdatedAt = new Date(existing[0].updated_at)
        const clientUpdatedAt = new Date(localUpdatedAt)

        if (clientUpdatedAt >= serverUpdatedAt) {
          if (action === 'delete') {
            await execute(
              `UPDATE racks SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`,
              [data.id, userId],
            )
            results.deleted.push(data.id)
          } else {
            await execute(
              `UPDATE racks SET name = ?, height = ?, width = ?, depth = ?,
               log_size = ?, volume_m3 = ?, volume_steres = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              [
                data.name,
                data.height,
                data.width,
                data.depth,
                data.logSize,
                data.volumeM3,
                data.volumeSteres,
                data.id,
                userId,
              ],
            )
            results.updated.push(data)
          }
        } else {
          results.conflicts.push({
            entityType: 'rack',
            entityId: data.id,
            winner: 'server',
            resolvedData: rackRowToApi(existing[0]),
          })
        }
      }
    }
  }

  return results
}

export async function processConsumptions(
  userId: string,
  items: SyncItem<ConsumptionEntry>[],
): Promise<ProcessResult<ConsumptionEntry>> {
  const results: ProcessResult<ConsumptionEntry> = {
    created: [],
    updated: [],
    deleted: [],
    conflicts: [],
  }

  for (const item of items) {
    const { data, action, localUpdatedAt } = item

    if (action === 'create') {
      const existing = await query<DbConsumptionRow[]>(
        'SELECT * FROM consumptions WHERE id = ? AND user_id = ?',
        [data.id, userId],
      )
      console.log([
        data.id,
        userId,
        data.rackId,
        data.type,
        data.percentage,
        new Date(data.date),
        data.weekNumber,
        data.year,
        data.notes || null,
        new Date(data.createdAt),
        new Date(localUpdatedAt),
        data.deletedAt ? new Date(data.deletedAt) : null,
      ])
      if (existing.length === 0) {
        await execute(
          `INSERT INTO consumptions (id, user_id, rack_id, type, percentage, date,
           week_number, year, notes, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.id,
            userId,
            data.rackId,
            data.type,
            data.percentage,
            new Date(data.date),
            data.weekNumber,
            data.year,
            data.notes || null,
            new Date(data.createdAt),
            new Date(localUpdatedAt),
            data.deletedAt ? new Date(data.deletedAt) : null,
          ],
        )
        results.created.push(data)
      }
    } else if (action === 'update' || action === 'delete') {
      const existing = await query<DbConsumptionRow[]>(
        'SELECT * FROM consumptions WHERE id = ? AND user_id = ?',
        [data.id, userId],
      )

      if (existing.length > 0) {
        const serverUpdatedAt = new Date(existing[0].updated_at)
        const clientUpdatedAt = new Date(localUpdatedAt)

        if (clientUpdatedAt >= serverUpdatedAt) {
          if (action === 'delete') {
            await execute(
              `UPDATE consumptions SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`,
              [data.id, userId],
            )
            results.deleted.push(data.id)
          } else {
            await execute(
              `UPDATE consumptions SET type = ?, percentage = ?, date = ?,
               week_number = ?, year = ?, notes = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              [
                data.type,
                data.percentage,
                new Date(data.date),
                data.weekNumber,
                data.year,
                data.notes,
                data.id,
                userId,
              ],
            )
            results.updated.push(data)
          }
        } else {
          results.conflicts.push({
            entityType: 'consumption',
            entityId: data.id,
            winner: 'server',
            resolvedData: consumptionRowToApi(existing[0]),
          })
        }
      }
    }
  }

  return results
}

export async function getServerChanges(
  userId: string,
  lastSyncTimestamp: string | null,
): Promise<{
  racks: { created: Rack[]; updated: Rack[]; deleted: string[] }
  consumptions: {
    created: ConsumptionEntry[]
    updated: ConsumptionEntry[]
    deleted: string[]
  }
}> {
  const since = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0)

  const rackRows = await query<DbRackRow[]>(
    `SELECT * FROM racks WHERE user_id = ? AND updated_at > ?`,
    [userId, since],
  )

  const consumptionRows = await query<DbConsumptionRow[]>(
    `SELECT * FROM consumptions WHERE user_id = ? AND updated_at > ?`,
    [userId, since],
  )

  return {
    racks: {
      created: rackRows
        .filter((r) => !r.deleted_at && new Date(r.created_at) > since)
        .map(rackRowToApi),
      updated: rackRows
        .filter((r) => !r.deleted_at && new Date(r.created_at) <= since)
        .map(rackRowToApi),
      deleted: rackRows.filter((r) => r.deleted_at).map((r) => r.id),
    },
    consumptions: {
      created: consumptionRows
        .filter((c) => !c.deleted_at && new Date(c.created_at) > since)
        .map(consumptionRowToApi),
      updated: consumptionRows
        .filter((c) => !c.deleted_at && new Date(c.created_at) <= since)
        .map(consumptionRowToApi),
      deleted: consumptionRows.filter((c) => c.deleted_at).map((c) => c.id),
    },
  }
}

export async function updateSyncMetadata(userId: string, timestamp: Date): Promise<void> {
  await execute(
    `INSERT INTO sync_metadata (user_id, last_sync_timestamp)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE last_sync_timestamp = ?`,
    [userId, timestamp, timestamp],
  )
}
