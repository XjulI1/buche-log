import { db } from './db'
import type { Rack, RackFormData } from '@/types'
import { calculateVolumeM3, calculateSteres } from '@/services/calculations/stere'

function generateId(): string {
  return crypto.randomUUID()
}

export async function getAllRacks(): Promise<Rack[]> {
  return db.racks.toArray()
}

export async function getRackById(id: string): Promise<Rack | undefined> {
  return db.racks.get(id)
}

export async function getDefaultRack(): Promise<Rack | undefined> {
  return db.racks.orderBy('createdAt').first()
}

export async function createRack(data: RackFormData): Promise<Rack> {
  const now = new Date()
  const volumeM3 = calculateVolumeM3(data.height, data.width, data.depth)
  const volumeSteres = calculateSteres(data.height, data.width, data.depth, data.logSize)

  const rack: Rack = {
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
  }

  await db.racks.add(rack)
  return rack
}

export async function updateRack(id: string, data: RackFormData): Promise<Rack | undefined> {
  const volumeM3 = calculateVolumeM3(data.height, data.width, data.depth)
  const volumeSteres = calculateSteres(data.height, data.width, data.depth, data.logSize)

  await db.racks.update(id, {
    ...data,
    volumeM3,
    volumeSteres,
    updatedAt: new Date(),
  })

  return getRackById(id)
}

export async function deleteRack(id: string): Promise<void> {
  await db.racks.delete(id)
}
