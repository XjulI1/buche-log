import { db } from './db'
import type { ConsumptionEntry, ConsumptionFormData } from '@/types'
import { getISOWeek } from '@/services/calculations/week'

function generateId(): string {
  return crypto.randomUUID()
}

export async function getAllConsumptions(): Promise<ConsumptionEntry[]> {
  return db.consumptions.orderBy('date').reverse().toArray()
}

export async function getConsumptionsByRack(rackId: string): Promise<ConsumptionEntry[]> {
  return db.consumptions.where('rackId').equals(rackId).reverse().sortBy('date')
}

export async function getConsumptionsByWeek(
  year: number,
  weekNumber: number,
): Promise<ConsumptionEntry[]> {
  return db.consumptions.where('[year+weekNumber]').equals([year, weekNumber]).sortBy('date')
}

export async function getConsumptionsByYear(year: number): Promise<ConsumptionEntry[]> {
  return db.consumptions.where('year').equals(year).sortBy('date')
}

export async function getLatestConsumption(rackId: string): Promise<ConsumptionEntry | undefined> {
  return db.consumptions.where('rackId').equals(rackId).reverse().sortBy('date').then((r) => r[0])
}

export async function createConsumption(
  rackId: string,
  data: ConsumptionFormData,
): Promise<ConsumptionEntry> {
  const { week, year } = getISOWeek(data.date)

  const entry: ConsumptionEntry = {
    id: generateId(),
    rackId,
    type: data.type,
    percentage: data.percentage,
    date: data.date,
    weekNumber: week,
    year,
    notes: data.notes,
    createdAt: new Date(),
  }

  await db.consumptions.add(entry)
  return entry
}

export async function updateConsumption(
  id: string,
  data: Partial<ConsumptionFormData>,
): Promise<ConsumptionEntry | undefined> {
  const existing = await db.consumptions.get(id)
  if (!existing) return undefined

  const updates: Partial<ConsumptionEntry> = { ...data }

  if (data.date) {
    const { week, year } = getISOWeek(data.date)
    updates.weekNumber = week
    updates.year = year
  }

  await db.consumptions.update(id, updates)
  return db.consumptions.get(id)
}

export async function deleteConsumption(id: string): Promise<void> {
  await db.consumptions.delete(id)
}

export async function deleteAllConsumptions(): Promise<void> {
  await db.consumptions.clear()
}
