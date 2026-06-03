export interface WeeklyStats {
  weekNumber: number
  year: number
  consumptionPercent: number // total % consumed this week
  reloadCount: number // number of reloads this week
  totalConsumedSteres: number
  entries: number // number of entries
}

export interface YearlyStats {
  year: number
  totalConsumedSteres: number
  weeklyAverageSteres: number
  peakWeek: number // week with highest consumption
  peakConsumption: number // steres consumed in peak week
  weeks: WeeklyStats[]
  totalReloads: number
}

export interface CurrentStatus {
  currentLevel: number // current %
  lastUpdate: Date | null
  steresRemaining: number
  weeklyConsumption: number // steres this week
}
