import type { Rack } from './rack'
import type { ConsumptionEntry } from './consumption'

/** Format d'export / import des donnees (v1 : saisies par delta, v2 : releves de niveau) */
export interface ExportData {
  version: number
  exportDate: string
  racks: Rack[]
  consumptions: ConsumptionEntry[]
}

export interface ImportResult {
  racks: number
  consumptions: number
}
