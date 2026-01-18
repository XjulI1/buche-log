import { db } from './db'
import type { RackFormData, SyncableRack } from '@/types'
import { calculateVolumeM3, calculateSteres } from '@/services/calculations/stere'
import { syncService } from '@/services/sync'

function generateId(): string {
  return crypto.randomUUID()
}

export async function getAllRacks(): Promise<SyncableRack[]> {
  // Exclude soft-deleted racks
  return db.racks.filter((r) => !r.deletedAt).toArray()
}

export async function getRackById(id: string): Promise<SyncableRack | undefined> {
  const rack = await db.racks.get(id)
  return rack?.deletedAt ? undefined : rack
}

export async function getDefaultRack(): Promise<SyncableRack | undefined> {
  return db.racks
    .filter((r) => !r.deletedAt)
    .sortBy('createdAt')
    .then((racks) => racks[0])
}

export async function createRack(data: RackFormData): Promise<SyncableRack> {
  const now = new Date()
  const volumeM3 = calculateVolumeM3(data.height, data.width, data.depth)
  const volumeSteres = calculateSteres(data.height, data.width, data.depth, data.logSize)

  const rack: SyncableRack = {
    id: generateId(),
    name: data.name,
    height: data.height,
    width: data.width,
    depth: data.depth,
    logSize: data.logSize,
    volumeM3,
    volumeSteres,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending',
  }

  await db.racks.add(rack)

  // Queue for sync
  if (syncService.isEnabled()) {
    await syncService.queueChange('rack', rack.id, 'create', rack)
  }

  return rack
}

export async function updateRack(
  id: string,
  data: RackFormData,
): Promise<SyncableRack | undefined> {
  const volumeM3 = calculateVolumeM3(data.height, data.width, data.depth)
  const volumeSteres = calculateSteres(data.height, data.width, data.depth, data.logSize)
  const now = new Date()

  await db.racks.update(id, {
    ...data,
    volumeM3,
    volumeSteres,
    updatedAt: now,
    syncStatus: 'pending',
  })

  const updated = await getRackById(id)

  if (updated && syncService.isEnabled()) {
    await syncService.queueChange('rack', id, 'update', updated)
  }

  return updated
}

export async function deleteRack(id: string): Promise<void> {
  const now = new Date()
  const rack = await db.racks.get(id)

  if (rack) {
    if (syncService.isEnabled()) {
      // Soft delete for sync
      await db.racks.update(id, {
        deletedAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      })

      const updated = await db.racks.get(id)
      if (updated) {
        await syncService.queueChange('rack', id, 'delete', updated)
      }
    } else {
      // Hard delete when sync is disabled
      await db.racks.delete(id)
    }
  }
}
