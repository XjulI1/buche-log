/**
 * Saison de chauffe : du 1er octobre au 30 septembre.
 * Une saison est identifiee par son annee de debut (2026 = 2026-2027).
 */
export const SEASON_START_MONTH = 9 // octobre (mois 0-indexe)

/** Fin de la periode de chauffe (exclue) : 1er mai de l'annee suivante */
export const HEATING_END_MONTH = 4 // mai (mois 0-indexe)

export function getSeason(date: Date): number {
  return date.getMonth() >= SEASON_START_MONTH ? date.getFullYear() : date.getFullYear() - 1
}

export function getCurrentSeason(): number {
  return getSeason(new Date())
}

export function getSeasonStart(season: number): Date {
  return new Date(season, SEASON_START_MONTH, 1)
}

export function getSeasonEnd(season: number): Date {
  return new Date(season + 1, SEASON_START_MONTH, 1)
}

export function getHeatingEnd(season: number): Date {
  return new Date(season + 1, HEATING_END_MONTH, 1)
}

export function isInSeason(date: Date, season: number): boolean {
  return date >= getSeasonStart(season) && date < getSeasonEnd(season)
}

export function formatSeason(season: number): string {
  return `${season}-${season + 1}`
}

/** Lundi (00:00, heure locale) de la semaine contenant la date */
export function getMonday(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

/** Lundis de toutes les semaines qui recouvrent la saison */
export function getSeasonWeekStarts(season: number): Date[] {
  const end = getSeasonEnd(season)
  const starts: Date[] = []
  for (let d = getMonday(getSeasonStart(season)); d < end; d.setDate(d.getDate() + 7)) {
    starts.push(new Date(d))
  }
  return starts
}
