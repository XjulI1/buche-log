import { describe, it, expect } from 'vitest'
import {
  calculateConsumptions,
  calculateCurrentLevel,
  calculateEntryConsumption,
  calculateForecast,
  calculateSeasonStats,
  calculateWeeklyStats,
  getPreviousEntry,
} from '../statistics'
import { getISOWeek } from '../week'
import type { ConsumptionEntry, Rack } from '#shared/types'

function createRack(overrides: Partial<Rack> = {}): Rack {
  return {
    id: 'rack-1',
    name: 'Test Rack',
    height: 150,
    width: 100,
    depth: 50,
    logSize: 33,
    volumeM3: 0.75,
    volumeSteres: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

let counter = 0
function reading(date: Date, level: number, reload?: [number, number]): ConsumptionEntry {
  const { week, year } = getISOWeek(date)
  counter++
  return {
    id: `entry-${counter}`,
    rackId: 'rack-1',
    level,
    reloadFrom: reload?.[0] ?? null,
    reloadTo: reload?.[1] ?? null,
    date,
    weekNumber: week,
    year,
    createdAt: new Date(2000, 0, 1, 0, 0, counter),
    updatedAt: new Date(),
  }
}

describe('statistics calculations', () => {
  describe('calculateEntryConsumption', () => {
    it('returns 0 for the first reading without reload', () => {
      expect(calculateEntryConsumption({ level: 80 }, null)).toBe(0)
    })

    it('is the level drop since the previous reading', () => {
      expect(calculateEntryConsumption({ level: 40 }, { level: 65 })).toBe(25)
    })

    it('adds consumption before and after a reload', () => {
      // 65 -> 20 (45 %), recharge a 100, puis 100 -> 80 (20 %)
      expect(
        calculateEntryConsumption({ level: 80, reloadFrom: 20, reloadTo: 100 }, { level: 65 }),
      ).toBe(65)
    })

    it('counts only post-reload consumption for the first reading', () => {
      expect(calculateEntryConsumption({ level: 90, reloadFrom: 0, reloadTo: 100 }, null)).toBe(10)
    })

    it('never returns a negative consumption', () => {
      expect(calculateEntryConsumption({ level: 70 }, { level: 50 })).toBe(0)
    })
  })

  describe('calculateCurrentLevel', () => {
    it('returns 0 without readings', () => {
      expect(calculateCurrentLevel([])).toBe(0)
    })

    it('returns the level of the most recent reading, whatever the input order', () => {
      const entries = [
        reading(new Date(2024, 0, 20), 30),
        reading(new Date(2024, 0, 10), 90),
        reading(new Date(2024, 0, 15), 60),
      ]
      expect(calculateCurrentLevel(entries)).toBe(30)
    })
  })

  describe('calculateConsumptions', () => {
    it('computes each reading against the chronologically previous one', () => {
      const a = reading(new Date(2024, 0, 1), 100)
      const b = reading(new Date(2024, 0, 8), 70)
      const c = reading(new Date(2024, 0, 15), 90, [40, 100])
      const result = calculateConsumptions([c, a, b])
      expect(result.get(a.id)).toBe(0)
      expect(result.get(b.id)).toBe(30)
      expect(result.get(c.id)).toBe(40)
    })
  })

  describe('getPreviousEntry', () => {
    it('ignores the excluded entry (edition)', () => {
      const a = reading(new Date(2024, 0, 1), 100)
      const b = reading(new Date(2024, 0, 8), 70)
      expect(getPreviousEntry([a, b], new Date(2024, 0, 8), b.id)?.id).toBe(a.id)
      expect(getPreviousEntry([a, b], new Date(2023, 11, 1))).toBeNull()
    })
  })

  describe('calculateWeeklyStats', () => {
    it('sums consumption and reloads of the week', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        reading(new Date(2024, 0, 8), 100),
        reading(new Date(2024, 0, 15), 70),
        reading(new Date(2024, 0, 18), 80, [50, 100]),
      ]
      const stats = calculateWeeklyStats(entries, rack, new Date(2024, 0, 15))
      expect(stats.weekNumber).toBe(3)
      expect(stats.consumedPercent).toBe(30 + 40)
      expect(stats.consumedSteres).toBeCloseTo(1.4)
      expect(stats.reloadCount).toBe(1)
      expect(stats.entries).toBe(2)
    })
  })

  describe('calculateSeasonStats', () => {
    it('covers October to September and compares with the last reading of the previous season', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        reading(new Date(2024, 8, 25), 100), // saison 2023
        reading(new Date(2024, 9, 2), 80), // saison 2024 : 20 %
        reading(new Date(2024, 9, 9), 50), // 30 %
        reading(new Date(2025, 9, 1), 10), // saison 2025
      ]
      const stats = calculateSeasonStats(entries, rack, 2024)
      expect(stats.readingsCount).toBe(2)
      expect(stats.totalConsumedSteres).toBeCloseTo(1)
      expect(stats.peakWeek?.consumedSteres).toBeCloseTo(0.6)
      expect(stats.weeks[0]!.weekStart).toEqual(new Date(2024, 8, 30))
      expect(stats.weeks.every((w) => w.weekStart < new Date(2025, 9, 1))).toBe(true)
    })

    it('averages only weeks with readings', () => {
      const rack = createRack({ volumeSteres: 1 })
      const entries = [
        reading(new Date(2024, 10, 4), 100),
        reading(new Date(2024, 10, 11), 50),
        reading(new Date(2024, 11, 2), 0),
      ]
      const stats = calculateSeasonStats(entries, rack, 2024)
      expect(stats.weeklyAverageSteres).toBeCloseTo(1 / 3)
    })
  })

  describe('calculateForecast', () => {
    it('returns null with less than two readings', () => {
      expect(calculateForecast([reading(new Date(2024, 10, 1), 80)], createRack())).toBeNull()
    })

    it('projects the empty date from the recent rate', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        reading(new Date(2024, 10, 1), 100),
        reading(new Date(2024, 10, 8), 80),
        reading(new Date(2024, 10, 15), 60),
      ]
      const forecast = calculateForecast(entries, rack, new Date(2024, 10, 15))!
      expect(forecast.percentPerWeek).toBeCloseTo(20)
      expect(forecast.steresPerWeek).toBeCloseTo(0.4)
      expect(forecast.daysUntilEmpty).toBeCloseTo(21)
      expect(forecast.basis).toBe('current-rate')
      // 15 nov. -> 1er mai : 167 jours a 20 %/semaine
      expect(forecast.remainingSeasonSteres).toBeCloseTo((2 * (20 / 7) * 167) / 100)
    })

    it('uses the previous season when it covers the rest of the heating period', () => {
      const rack = createRack({ volumeSteres: 1 })
      const entries = [
        reading(new Date(2023, 10, 1), 100),
        reading(new Date(2024, 0, 1), 50), // 50 % apres le 15 nov. 2023
        reading(new Date(2024, 4, 5), 20, [0, 100]), // 50 % + 80 %
        reading(new Date(2024, 10, 1), 100),
        reading(new Date(2024, 10, 8), 90),
      ]
      const forecast = calculateForecast(entries, rack, new Date(2024, 10, 15))!
      expect(forecast.basis).toBe('previous-season')
      expect(forecast.remainingSeasonSteres).toBeCloseTo(1.8)
    })

    it('has no empty date when nothing was consumed', () => {
      const entries = [reading(new Date(2024, 10, 1), 50), reading(new Date(2024, 10, 8), 50)]
      const forecast = calculateForecast(entries, createRack(), new Date(2024, 10, 8))!
      expect(forecast.daysUntilEmpty).toBeNull()
      expect(forecast.emptyDate).toBeNull()
    })
  })
})
