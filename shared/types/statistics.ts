export interface WeeklyStats {
  weekNumber: number
  year: number
  weekStart: Date
  consumedPercent: number // % du porte-buches consomme cette semaine
  consumedSteres: number
  reloadCount: number
  entries: number // nombre de releves
}

/** Saison de chauffe, identifiee par l'annee de debut (ex. 2026 = oct. 2026 -> sept. 2027) */
export interface SeasonStats {
  season: number
  totalConsumedSteres: number
  weeklyAverageSteres: number
  peakWeek: WeeklyStats | null
  totalReloads: number
  readingsCount: number
  weeks: WeeklyStats[]
}

export interface Forecast {
  steresPerWeek: number
  percentPerWeek: number
  daysUntilEmpty: number | null
  emptyDate: Date | null
  /** Steres encore necessaires jusqu'a la fin de la periode de chauffe */
  remainingSeasonSteres: number | null
  basis: 'previous-season' | 'current-rate'
}
