import { and, eq, gt } from 'drizzle-orm'
import type {
  ConflictResolution,
  Rack,
  ConsumptionEntry,
  SyncItem,
  SyncableRack,
  SyncableConsumptionEntry,
} from '#shared/types'
import { consumptions, racks, syncMetadata } from '../database/schema'
import { consumptionRowToApi, rackRowToApi } from './mappers'

interface ProcessResult<T> {
  created: T[]
  updated: T[]
  deleted: string[]
  conflicts: ConflictResolution[]
}

export async function processRacks(
  userId: string,
  items: SyncItem<SyncableRack>[],
): Promise<ProcessResult<Rack>> {
  const db = useDb()
  const results: ProcessResult<Rack> = { created: [], updated: [], deleted: [], conflicts: [] }

  for (const item of items) {
    const { data, action, localUpdatedAt } = item

    if (action === 'create') {
      const [existing] = await db
        .select({ id: racks.id })
        .from(racks)
        .where(and(eq(racks.id, data.id), eq(racks.userId, userId)))
        .limit(1)

      if (!existing) {
        await db.insert(racks).values({
          id: data.id,
          userId,
          name: data.name,
          height: String(data.height),
          width: String(data.width),
          depth: String(data.depth),
          logSize: String(data.logSize) as '25' | '33' | '50',
          volumeM3: String(data.volumeM3),
          volumeSteres: String(data.volumeSteres),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(localUpdatedAt),
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        })
        results.created.push(data)
      }
    } else if (action === 'update' || action === 'delete') {
      const [existing] = await db
        .select()
        .from(racks)
        .where(and(eq(racks.id, data.id), eq(racks.userId, userId)))
        .limit(1)

      if (existing) {
        const serverUpdatedAt = new Date(existing.updatedAt)
        const clientUpdatedAt = new Date(localUpdatedAt)

        if (clientUpdatedAt >= serverUpdatedAt) {
          if (action === 'delete') {
            const now = new Date()
            await db
              .update(racks)
              .set({ deletedAt: now, updatedAt: now })
              .where(and(eq(racks.id, data.id), eq(racks.userId, userId)))
            results.deleted.push(data.id)
          } else {
            await db
              .update(racks)
              .set({
                name: data.name,
                height: String(data.height),
                width: String(data.width),
                depth: String(data.depth),
                logSize: String(data.logSize) as '25' | '33' | '50',
                volumeM3: String(data.volumeM3),
                volumeSteres: String(data.volumeSteres),
                updatedAt: new Date(),
              })
              .where(and(eq(racks.id, data.id), eq(racks.userId, userId)))
            results.updated.push(data)
          }
        } else {
          results.conflicts.push({
            entityType: 'rack',
            entityId: data.id,
            winner: 'server',
            resolvedData: rackRowToApi(existing),
          })
        }
      }
    }
  }

  return results
}

export async function processConsumptions(
  userId: string,
  items: SyncItem<SyncableConsumptionEntry>[],
): Promise<ProcessResult<ConsumptionEntry>> {
  const db = useDb()
  const results: ProcessResult<ConsumptionEntry> = {
    created: [],
    updated: [],
    deleted: [],
    conflicts: [],
  }

  for (const item of items) {
    const { data, action, localUpdatedAt } = item

    if (action === 'create') {
      const [existing] = await db
        .select({ id: consumptions.id })
        .from(consumptions)
        .where(and(eq(consumptions.id, data.id), eq(consumptions.userId, userId)))
        .limit(1)

      if (!existing) {
        await db.insert(consumptions).values({
          id: data.id,
          userId,
          rackId: data.rackId,
          type: data.type,
          percentage: data.percentage,
          date: new Date(data.date),
          weekNumber: data.weekNumber,
          year: data.year,
          notes: data.notes ?? null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(localUpdatedAt),
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        })
        results.created.push(data)
      }
    } else if (action === 'update' || action === 'delete') {
      const [existing] = await db
        .select()
        .from(consumptions)
        .where(and(eq(consumptions.id, data.id), eq(consumptions.userId, userId)))
        .limit(1)

      if (existing) {
        const serverUpdatedAt = new Date(existing.updatedAt)
        const clientUpdatedAt = new Date(localUpdatedAt)

        if (clientUpdatedAt >= serverUpdatedAt) {
          if (action === 'delete') {
            const now = new Date()
            await db
              .update(consumptions)
              .set({ deletedAt: now, updatedAt: now })
              .where(and(eq(consumptions.id, data.id), eq(consumptions.userId, userId)))
            results.deleted.push(data.id)
          } else {
            await db
              .update(consumptions)
              .set({
                type: data.type,
                percentage: data.percentage,
                date: new Date(data.date),
                weekNumber: data.weekNumber,
                year: data.year,
                notes: data.notes ?? null,
                updatedAt: new Date(),
              })
              .where(and(eq(consumptions.id, data.id), eq(consumptions.userId, userId)))
            results.updated.push(data)
          }
        } else {
          results.conflicts.push({
            entityType: 'consumption',
            entityId: data.id,
            winner: 'server',
            resolvedData: consumptionRowToApi(existing),
          })
        }
      }
    }
  }

  return results
}

export async function getServerChanges(userId: string, lastSyncTimestamp: string | null) {
  const db = useDb()
  const since = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0)

  const rackRows = await db
    .select()
    .from(racks)
    .where(and(eq(racks.userId, userId), gt(racks.updatedAt, since)))

  const consumptionRows = await db
    .select()
    .from(consumptions)
    .where(and(eq(consumptions.userId, userId), gt(consumptions.updatedAt, since)))

  return {
    racks: {
      created: rackRows
        .filter((r) => !r.deletedAt && new Date(r.createdAt) > since)
        .map(rackRowToApi),
      updated: rackRows
        .filter((r) => !r.deletedAt && new Date(r.createdAt) <= since)
        .map(rackRowToApi),
      deleted: rackRows.filter((r) => r.deletedAt).map((r) => r.id),
    },
    consumptions: {
      created: consumptionRows
        .filter((c) => !c.deletedAt && new Date(c.createdAt) > since)
        .map(consumptionRowToApi),
      updated: consumptionRows
        .filter((c) => !c.deletedAt && new Date(c.createdAt) <= since)
        .map(consumptionRowToApi),
      deleted: consumptionRows.filter((c) => c.deletedAt).map((c) => c.id),
    },
  }
}

export async function updateSyncMetadata(userId: string, timestamp: Date): Promise<void> {
  const db = useDb()
  await db
    .insert(syncMetadata)
    .values({ userId, lastSyncTimestamp: timestamp })
    .onDuplicateKeyUpdate({ set: { lastSyncTimestamp: timestamp } })
}
