export type ConsumptionType = 'reload' | 'consumption'

export interface ConsumptionEntry {
  id: string
  rackId: string
  type: ConsumptionType
  percentage: number // 0-100 (for reload: new level, for consumption: % consumed)
  date: Date
  weekNumber: number // ISO week 1-53
  year: number
  notes?: string
  createdAt: Date
  updatedAt?: Date
}

export interface ConsumptionFormData {
  type: ConsumptionType
  percentage: number
  date: Date
  notes?: string
}
