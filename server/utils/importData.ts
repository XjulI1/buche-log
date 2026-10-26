import { convertLegacyEntries, type LegacyEntry } from '#shared/utils/legacyReadings'
import type { ConsumptionRow, RackRow } from '../database/schema'
import { badRequest, parseRackInput, parseReadingInput } from './inputs'

function toDateOr(value: unknown, fallback: Date): Date {
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? fallback : d
}

/**
 * Prepare les lignes a inserer pour un import (export v1 ou v2).
 * Les identifiants sont regeneres : un export peut etre reimporte sans collision.
 * Les releves dont le porte-buches est absent du fichier sont ignores.
 */
export function prepareImport(
  data: unknown,
  userId: string,
  now: Date,
  newId: () => string,
): { racks: RackRow[]; consumptions: ConsumptionRow[] } {
  const d = (data ?? {}) as Record<string, unknown>
  if (!d.version || !Array.isArray(d.racks) || !Array.isArray(d.consumptions)) {
    badRequest('Invalid export format')
  }

  const rackIds = new Map<string, string>()
  const racks: RackRow[] = d.racks.map((r: Record<string, unknown>) => {
    const id = newId()
    rackIds.set(String(r.id), id)
    const createdAt = toDateOr(r.createdAt, now)
    return {
      id,
      userId,
      ...parseRackInput(r),
      createdAt,
      updatedAt: toDateOr(r.updatedAt, createdAt),
      deletedAt: null,
    }
  })

  // Export v1 : saisies par delta (type + percentage) a convertir en releves de niveau
  const legacy =
    Number(d.version) < 2 ? convertLegacyEntries(d.consumptions as LegacyEntry[]) : null

  const consumptions: ConsumptionRow[] = []
  for (const c of d.consumptions as Record<string, unknown>[]) {
    const rackId = rackIds.get(String(c.rackId))
    if (!rackId) continue
    const createdAt = toDateOr(c.createdAt, now)
    consumptions.push({
      id: newId(),
      userId,
      rackId,
      ...parseReadingInput({ ...c, ...(legacy?.get(String(c.id)) ?? {}) }),
      type: null,
      percentage: null,
      createdAt,
      updatedAt: toDateOr(c.updatedAt, createdAt),
      deletedAt: null,
    })
  }

  return { racks, consumptions }
}
