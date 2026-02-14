import type { ConsumptionEntry, WeeklyStats, YearlyStats, Rack } from '@/types'
import { calculateConsumptionSteres } from './stere'
import { getWeeksInYear } from './week'

/**
 * Calcule les statistiques hebdomadaires
 * La consommation est la somme des entrées de type 'consumption'
 * Les rechargements ne comptent pas dans la consommation
 */
export function calculateWeeklyStats(
  entries: ConsumptionEntry[],
  rack: Rack,
  weekNumber: number,
  year: number,
): WeeklyStats {
  const weekEntries = entries.filter((e) => e.weekNumber === weekNumber && e.year === year)

  // Somme des consommations (type 'consumption')
  const consumptions = weekEntries.filter((e) => e.type === 'consumption')
  const consumptionPercent = consumptions.reduce((sum, e) => sum + e.percentage, 0)

  // Nombre de rechargements
  const reloadCount = weekEntries.filter((e) => e.type === 'reload').length

  const totalConsumedSteres = calculateConsumptionSteres(rack.volumeSteres, consumptionPercent)

  return {
    weekNumber,
    year,
    consumptionPercent,
    reloadCount,
    totalConsumedSteres,
    entries: weekEntries.length,
  }
}

/**
 * Calcule les statistiques annuelles
 */
export function calculateYearlyStats(
  entries: ConsumptionEntry[],
  rack: Rack,
  year: number,
): YearlyStats {
  const yearEntries = entries.filter((e) => e.year === year)
  const weeksInYear = getWeeksInYear(year)

  const weeks: WeeklyStats[] = []
  let totalConsumedSteres = 0
  let peakWeek = 0
  let peakConsumption = 0
  let totalReloads = 0

  for (let week = 1; week <= weeksInYear; week++) {
    const weekStats = calculateWeeklyStats(yearEntries, rack, week, year)
    weeks.push(weekStats)

    totalConsumedSteres += weekStats.totalConsumedSteres
    totalReloads += weekStats.reloadCount

    if (weekStats.totalConsumedSteres > peakConsumption) {
      peakConsumption = weekStats.totalConsumedSteres
      peakWeek = week
    }
  }

  const weeksWithData = weeks.filter((w) => w.entries > 0).length
  const weeklyAverageSteres = weeksWithData > 0 ? totalConsumedSteres / weeksWithData : 0

  return {
    year,
    totalConsumedSteres,
    weeklyAverageSteres,
    peakWeek,
    peakConsumption,
    weeks,
    totalReloads,
  }
}

/**
 * Calcule le niveau actuel du porte-buches
 * Le niveau est calculé en partant de 0 et en appliquant les rechargements (ajouts)
 * et consommations (retraits) dans l'ordre chronologique
 */
export function calculateCurrentLevel(entries: ConsumptionEntry[]): number {
  if (entries.length === 0) return 0

  // Trier par date croissante
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())

  let currentLevel = 0

  for (const entry of sorted) {
    if (entry.type === 'reload') {
      // Un rechargement ajoute du bois au niveau actuel (plafonné à 100%)
      currentLevel = Math.min(100, currentLevel + entry.percentage)
    } else if (entry.type === 'consumption') {
      // Une consommation diminue le niveau (plancher à 0%)
      currentLevel = Math.max(0, currentLevel - entry.percentage)
    }
  }

  return currentLevel
}
