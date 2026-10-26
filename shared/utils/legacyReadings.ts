import type { LegacyConsumptionType } from '../types/consumption'

export interface LegacyEntry {
  id: string
  rackId: string
  type: LegacyConsumptionType
  percentage: number
  date: Date | string
  createdAt: Date | string
}

export interface ConvertedReading {
  level: number
  reloadFrom: number | null
  reloadTo: number | null
}

/**
 * Convertit les anciennes saisies (delta de consommation / ajout de rechargement)
 * en releves de niveau, en rejouant l'historique de chaque porte-buches dans
 * l'ordre chronologique. Le resultat reproduit le niveau affiche par l'ancienne
 * version et conserve les consommations calculees.
 */
export function convertLegacyEntries(entries: LegacyEntry[]): Map<string, ConvertedReading> {
  const result = new Map<string, ConvertedReading>()
  const byRack = new Map<string, LegacyEntry[]>()

  for (const entry of entries) {
    const list = byRack.get(entry.rackId) ?? []
    list.push(entry)
    byRack.set(entry.rackId, list)
  }

  for (const list of byRack.values()) {
    list.sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime() ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    let level = 0
    for (const entry of list) {
      if (entry.type === 'reload') {
        const before = level
        level = Math.min(100, level + entry.percentage)
        result.set(entry.id, { level, reloadFrom: before, reloadTo: level })
      } else {
        level = Math.max(0, level - entry.percentage)
        result.set(entry.id, { level, reloadFrom: null, reloadTo: null })
      }
    }
  }

  return result
}
