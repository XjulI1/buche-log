import type { ConsumptionEntry, Forecast, Rack, SeasonStats, WeeklyStats } from '#shared/types'
import { calculateConsumptionSteres } from './stere'
import { getISOWeek } from './week'
import { getHeatingEnd, getSeason, getSeasonWeekStarts, isInSeason } from './season'

const DAY_MS = 86_400_000
const FORECAST_WINDOW_DAYS = 28

/**
 * Trie les releves par ordre chronologique (date, puis date de creation)
 */
export function sortEntries<T extends ConsumptionEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  )
}

export function hasReload(entry: Pick<ConsumptionEntry, 'reloadFrom' | 'reloadTo'>): boolean {
  return entry.reloadFrom != null && entry.reloadTo != null
}

/**
 * Pourcentage consomme entre le releve precedent et ce releve.
 * Avec rechargement : (precedent -> avant recharge) + (apres recharge -> constate).
 */
export function calculateEntryConsumption(
  entry: Pick<ConsumptionEntry, 'level' | 'reloadFrom' | 'reloadTo'>,
  previous: Pick<ConsumptionEntry, 'level'> | null | undefined,
): number {
  let consumed: number
  if (hasReload(entry)) {
    const beforeReload = previous ? previous.level - entry.reloadFrom! : 0
    consumed = beforeReload + (entry.reloadTo! - entry.level)
  } else {
    consumed = previous ? previous.level - entry.level : 0
  }
  return Math.max(0, consumed)
}

/**
 * Consommation (en %) de chaque releve, indexee par id
 */
export function calculateConsumptions(entries: ConsumptionEntry[]): Map<string, number> {
  const result = new Map<string, number>()
  let previous: ConsumptionEntry | null = null
  for (const entry of sortEntries(entries)) {
    result.set(entry.id, calculateEntryConsumption(entry, previous))
    previous = entry
  }
  return result
}

/**
 * Niveau actuel = niveau du releve le plus recent
 */
export function calculateCurrentLevel(entries: ConsumptionEntry[]): number {
  const sorted = sortEntries(entries)
  return sorted[sorted.length - 1]?.level ?? 0
}

/**
 * Releve qui precede une date donnee (en ignorant eventuellement un releve en cours d'edition)
 */
export function getPreviousEntry<T extends ConsumptionEntry>(
  entries: T[],
  date: Date,
  excludeId?: string,
): T | null {
  const before = sortEntries(entries).filter(
    (e) => e.id !== excludeId && e.date.getTime() <= date.getTime(),
  )
  return before[before.length - 1] ?? null
}

/**
 * Statistiques d'une semaine (identifiee par son lundi)
 */
export function calculateWeeklyStats(
  entries: ConsumptionEntry[],
  rack: Rack,
  weekStart: Date,
  consumptions: Map<string, number> = calculateConsumptions(entries),
  filter: (entry: ConsumptionEntry) => boolean = () => true,
): WeeklyStats {
  const { week, year } = getISOWeek(weekStart)
  const weekEntries = entries.filter(
    (e) => e.weekNumber === week && e.year === year && filter(e),
  )
  const consumedPercent = weekEntries.reduce((sum, e) => sum + (consumptions.get(e.id) ?? 0), 0)

  return {
    weekNumber: week,
    year,
    weekStart,
    consumedPercent,
    consumedSteres: calculateConsumptionSteres(rack.volumeSteres, consumedPercent),
    reloadCount: weekEntries.filter(hasReload).length,
    entries: weekEntries.length,
  }
}

/**
 * Statistiques d'une saison de chauffe (octobre -> septembre)
 */
export function calculateSeasonStats(
  entries: ConsumptionEntry[],
  rack: Rack,
  season: number,
): SeasonStats {
  // La consommation est calculee sur tout l'historique : le premier releve de la
  // saison se compare au dernier releve de la saison precedente.
  const consumptions = calculateConsumptions(entries)
  const inSeason = (e: ConsumptionEntry) => isInSeason(e.date, season)

  const weeks = getSeasonWeekStarts(season).map((start) =>
    calculateWeeklyStats(entries, rack, start, consumptions, inSeason),
  )

  const totalConsumedSteres = weeks.reduce((sum, w) => sum + w.consumedSteres, 0)
  const weeksWithData = weeks.filter((w) => w.entries > 0).length
  const peakWeek = weeks.reduce<WeeklyStats | null>(
    (peak, w) => (w.consumedSteres > (peak?.consumedSteres ?? 0) ? w : peak),
    null,
  )

  return {
    season,
    totalConsumedSteres,
    weeklyAverageSteres: weeksWithData > 0 ? totalConsumedSteres / weeksWithData : 0,
    peakWeek,
    totalReloads: weeks.reduce((sum, w) => sum + w.reloadCount, 0),
    readingsCount: weeks.reduce((sum, w) => sum + w.entries, 0),
    weeks,
  }
}

/**
 * Prevision basee sur le rythme des 4 dernieres semaines.
 * Les steres restant a consommer sur la saison s'appuient sur la saison precedente
 * a la meme periode si elle est connue, sinon sur le rythme actuel.
 */
export function calculateForecast(
  entries: ConsumptionEntry[],
  rack: Rack,
  now: Date = new Date(),
): Forecast | null {
  const sorted = sortEntries(entries).filter((e) => e.date.getTime() <= now.getTime())
  const last = sorted[sorted.length - 1]
  if (!last || sorted.length < 2) return null

  const windowStart = now.getTime() - FORECAST_WINDOW_DAYS * DAY_MS
  const baseline = [...sorted].reverse().find((e) => e.date.getTime() <= windowStart) ?? sorted[0]!
  const consumptions = calculateConsumptions(sorted)
  const recent = sorted.filter((e) => e.date.getTime() > baseline.date.getTime())
  const days = (last.date.getTime() - baseline.date.getTime()) / DAY_MS
  if (recent.length === 0 || days < 1) return null

  const consumedPercent = recent.reduce((sum, e) => sum + (consumptions.get(e.id) ?? 0), 0)
  const percentPerDay = consumedPercent / days
  const percentPerWeek = percentPerDay * 7

  const daysUntilEmpty = percentPerDay > 0 ? last.level / percentPerDay : null
  const emptyDate =
    daysUntilEmpty !== null ? new Date(last.date.getTime() + daysUntilEmpty * DAY_MS) : null

  const season = getSeason(now)
  const heatingEnd = getHeatingEnd(season)
  let remainingSeasonSteres: number | null = null
  let basis: Forecast['basis'] = 'current-rate'

  if (now < heatingEnd) {
    const previousSeason = season - 1
    const samePointLastYear = new Date(now)
    samePointLastYear.setFullYear(now.getFullYear() - 1)
    const previousHeatingEnd = getHeatingEnd(previousSeason)
    const previousEntries = sorted.filter((e) => isInSeason(e.date, previousSeason))
    // Premier releve apres la fin de chauffe : il cloture la consommation de l'hiver
    const closing = previousEntries.find((e) => e.date >= previousHeatingEnd)
    const coversPeriod = !!closing && previousEntries.some((e) => e.date <= samePointLastYear)

    if (closing && coversPeriod) {
      basis = 'previous-season'
      const percent = previousEntries
        .filter((e) => e.date > samePointLastYear && e.date <= closing.date)
        .reduce((sum, e) => sum + (consumptions.get(e.id) ?? 0), 0)
      remainingSeasonSteres = calculateConsumptionSteres(rack.volumeSteres, percent)
    } else {
      const remainingDays = (heatingEnd.getTime() - now.getTime()) / DAY_MS
      remainingSeasonSteres = calculateConsumptionSteres(
        rack.volumeSteres,
        percentPerDay * remainingDays,
      )
    }
  }

  return {
    steresPerWeek: calculateConsumptionSteres(rack.volumeSteres, percentPerWeek),
    percentPerWeek,
    daysUntilEmpty,
    emptyDate,
    remainingSeasonSteres,
    basis,
  }
}
