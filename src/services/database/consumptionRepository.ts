import { db } from './db'
import type { ConsumptionFormData, SyncableConsumptionEntry } from '@/types'
import { getISOWeek } from '@/services/calculations/week'
import { syncService } from '@/services/sync'

function generateId(): string {
  return crypto.randomUUID()
}

export async function getAllConsumptions(): Promise<SyncableConsumptionEntry[]> {
  return db.consumptions
    .filter((c) => !c.deletedAt)
    .reverse()
    .sortBy('date')
}

export async function getConsumptionsByRack(
  rackId: string,
): Promise<SyncableConsumptionEntry[]> {
  return db.consumptions
    .where('rackId')
    .equals(rackId)
    .filter((c) => !c.deletedAt)
    .reverse()
    .sortBy('date')
}

export async function getConsumptionsByWeek(
  year: number,
  weekNumber: number,
): Promise<SyncableConsumptionEntry[]> {
  const entries = await db.consumptions
    .where('[year+weekNumber]')
    .equals([year, weekNumber])
    .sortBy('date')
  return entries.filter((c) => !c.deletedAt)
}

export async function getConsumptionsByYear(
  year: number,
): Promise<SyncableConsumptionEntry[]> {
  const entries = await db.consumptions.where('year').equals(year).sortBy('date')
  return entries.filter((c) => !c.deletedAt)
}

export async function getLatestConsumption(
  rackId: string,
): Promise<SyncableConsumptionEntry | undefined> {
  return db.consumptions
    .where('rackId')
    .equals(rackId)
    .filter((c) => !c.deletedAt)
    .reverse()
    .sortBy('date')
    .then((r) => r[0])
}

export async function createConsumption(
  rackId: string,
  data: ConsumptionFormData,
): Promise<SyncableConsumptionEntry> {
  const { week, year } = getISOWeek(data.date)
  const now = new Date()

  const entry: SyncableConsumptionEntry = {
    id: generateId(),
    rackId,
    type: data.type,
    percentage: data.percentage,
    date: data.date,
    weekNumber: week,
    year,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending',
  }

  await db.consumptions.add(entry)

  if (syncService.isEnabled()) {
    await syncService.queueChange('consumption', entry.id, 'create', entry)
  }

  return entry
}

export async function updateConsumption(
  id: string,
  data: Partial<ConsumptionFormData>,
): Promise<SyncableConsumptionEntry | undefined> {
  const existing = await db.consumptions.get(id)
  if (!existing || existing.deletedAt) return undefined

  const updates: Partial<SyncableConsumptionEntry> = {
    ...data,
    updatedAt: new Date(),
    syncStatus: 'pending',
  }

  if (data.date) {
    const { week, year } = getISOWeek(data.date)
    updates.weekNumber = week
    updates.year = year
  }

  await db.consumptions.update(id, updates)
  const updated = await db.consumptions.get(id)

  if (updated && syncService.isEnabled()) {
    await syncService.queueChange('consumption', id, 'update', updated)
  }

  return updated
}

export async function deleteConsumption(id: string): Promise<void> {
  const now = new Date()
  const entry = await db.consumptions.get(id)

  if (entry) {
    if (syncService.isEnabled()) {
      // Soft delete for sync
      await db.consumptions.update(id, {
        deletedAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      })

      const updated = await db.consumptions.get(id)
      if (updated) {
        await syncService.queueChange('consumption', id, 'delete', updated)
      }
    } else {
      // Hard delete when sync is disabled
      await db.consumptions.delete(id)
    }
  }
}

export async function deleteAllConsumptions(): Promise<void> {
  if (syncService.isEnabled()) {
    const now = new Date()
    const entries = await db.consumptions.filter((c) => !c.deletedAt).toArray()

    for (const entry of entries) {
      await db.consumptions.update(entry.id, {
        deletedAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      })

      const updated = await db.consumptions.get(entry.id)
      if (updated) {
        await syncService.queueChange('consumption', entry.id, 'delete', updated)
      }
    }
  } else {
    await db.consumptions.clear()
  }
}
