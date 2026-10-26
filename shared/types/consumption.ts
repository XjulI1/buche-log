/**
 * Releve de niveau du porte-buches.
 * On saisit le niveau constate ; la consommation est deduite du releve precedent.
 * Si un rechargement a eu lieu depuis le releve precedent, on note le niveau
 * juste avant (`reloadFrom`) et juste apres (`reloadTo`) le rechargement.
 */
export interface ConsumptionEntry {
  id: string
  rackId: string
  level: number // 0-100, niveau constate au moment du releve
  reloadFrom?: number | null // 0-100, niveau juste avant rechargement
  reloadTo?: number | null // 0-100, niveau juste apres rechargement
  date: Date
  weekNumber: number // ISO week 1-53
  year: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface ConsumptionFormData {
  level: number
  reloadFrom?: number | null
  reloadTo?: number | null
  date: Date
  notes?: string
}

/** Ancien format (saisie par delta), conserve pour la migration des donnees. */
export type LegacyConsumptionType = 'reload' | 'consumption'
