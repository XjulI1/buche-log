import type { ConsumptionEntry, LogSize, Rack } from '#shared/types'
import type { ConsumptionRow, RackRow } from '../database/schema'

export function rackRowToApi(row: RackRow): Rack {
  return {
    id: row.id,
    name: row.name,
    height: Number(row.height),
    width: Number(row.width),
    depth: Number(row.depth),
    logSize: Number(row.logSize) as LogSize,
    volumeM3: Number(row.volumeM3),
    volumeSteres: Number(row.volumeSteres),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export function consumptionRowToApi(row: ConsumptionRow): ConsumptionEntry {
  return {
    id: row.id,
    rackId: row.rackId,
    type: row.type,
    percentage: row.percentage,
    date: row.date instanceof Date ? row.date : new Date(row.date),
    weekNumber: row.weekNumber,
    year: row.year,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}
