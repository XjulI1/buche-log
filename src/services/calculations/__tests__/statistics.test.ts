import { describe, it, expect } from 'vitest'
import { calculateWeeklyStats, calculateYearlyStats, calculateCurrentLevel } from '../statistics'
import type { ConsumptionEntry, Rack } from '@/types'

function createRack(overrides: Partial<Rack> = {}): Rack {
  return {
    id: 'rack-1',
    name: 'Test Rack',
    height: 150,
    width: 100,
    depth: 50,
    logSize: 33,
    volumeM3: 0.75,
    volumeSteres: 1.07,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createEntry(overrides: Partial<ConsumptionEntry> = {}): ConsumptionEntry {
  return {
    id: `entry-${Math.random()}`,
    rackId: 'rack-1',
    type: 'consumption',
    percentage: 10,
    date: new Date(2024, 0, 15),
    weekNumber: 3,
    year: 2024,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('statistics calculations', () => {
  describe('calculateWeeklyStats', () => {
    it('should return default values for empty entries', () => {
      const rack = createRack()
      const result = calculateWeeklyStats([], rack, 1, 2024)

      expect(result).toEqual({
        weekNumber: 1,
        year: 2024,
        consumptionPercent: 0,
        reloadCount: 0,
        totalConsumedSteres: 0,
        entries: 0,
      })
    })

    it('should calculate consumption from consumption entries', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        createEntry({ type: 'consumption', percentage: 20, date: new Date(2024, 0, 15) }),
        createEntry({ type: 'consumption', percentage: 10, date: new Date(2024, 0, 18) }),
      ]

      const result = calculateWeeklyStats(entries, rack, 3, 2024)

      expect(result.consumptionPercent).toBe(30)
      // 30% of 2 steres = 0.6 steres
      expect(result.totalConsumedSteres).toBeCloseTo(0.6, 2)
    })

    it('should not include reloads in consumption calculation', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        createEntry({ type: 'consumption', percentage: 20, date: new Date(2024, 0, 15) }),
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 16) }),
        createEntry({ type: 'consumption', percentage: 15, date: new Date(2024, 0, 18) }),
      ]

      const result = calculateWeeklyStats(entries, rack, 3, 2024)

      expect(result.consumptionPercent).toBe(35) // Only consumptions: 20 + 15
      expect(result.reloadCount).toBe(1)
      // 35% of 2 steres = 0.7 steres
      expect(result.totalConsumedSteres).toBeCloseTo(0.7, 2)
    })

    it('should filter entries by week and year', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        createEntry({ weekNumber: 3, year: 2024, percentage: 20 }),
        createEntry({ weekNumber: 4, year: 2024, percentage: 50 }), // Different week
        createEntry({ weekNumber: 3, year: 2023, percentage: 30 }), // Different year
      ]

      const result = calculateWeeklyStats(entries, rack, 3, 2024)

      expect(result.entries).toBe(1)
      expect(result.consumptionPercent).toBe(20)
    })

    it('should count multiple reloads', () => {
      const rack = createRack()
      const entries = [
        createEntry({ type: 'reload', percentage: 100 }),
        createEntry({ type: 'reload', percentage: 100 }),
      ]

      const result = calculateWeeklyStats(entries, rack, 3, 2024)

      expect(result.reloadCount).toBe(2)
      expect(result.consumptionPercent).toBe(0) // Reloads don't count as consumption
    })
  })

  describe('calculateYearlyStats', () => {
    it('should return empty stats for year with no entries', () => {
      const rack = createRack()
      const result = calculateYearlyStats([], rack, 2024)

      expect(result.year).toBe(2024)
      expect(result.totalConsumedSteres).toBe(0)
      expect(result.weeklyAverageSteres).toBe(0)
      expect(result.totalReloads).toBe(0)
      expect(result.weeks.length).toBe(52)
    })

    it('should aggregate consumption across weeks', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        // Week 1: 20% consumption
        createEntry({ weekNumber: 1, year: 2024, type: 'consumption', percentage: 20 }),
        // Week 2: 30% consumption
        createEntry({ weekNumber: 2, year: 2024, type: 'consumption', percentage: 30 }),
      ]

      const result = calculateYearlyStats(entries, rack, 2024)

      // Week 1: 20% of 2 = 0.4 steres
      // Week 2: 30% of 2 = 0.6 steres
      // Total: 1.0 steres
      expect(result.totalConsumedSteres).toBeCloseTo(1.0, 2)
    })

    it('should calculate weekly average only for weeks with data', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        createEntry({ weekNumber: 1, year: 2024, type: 'consumption', percentage: 20 }),
        createEntry({ weekNumber: 2, year: 2024, type: 'consumption', percentage: 30 }),
      ]

      const result = calculateYearlyStats(entries, rack, 2024)

      // 2 weeks with data, total = 1.0 steres
      expect(result.weeklyAverageSteres).toBeCloseTo(0.5, 2)
    })

    it('should find peak consumption week', () => {
      const rack = createRack({ volumeSteres: 2 })
      const entries = [
        // Week 1: small consumption
        createEntry({ weekNumber: 1, year: 2024, type: 'consumption', percentage: 5 }),
        // Week 5: big consumption
        createEntry({ weekNumber: 5, year: 2024, type: 'consumption', percentage: 50 }),
      ]

      const result = calculateYearlyStats(entries, rack, 2024)

      expect(result.peakWeek).toBe(5)
      // 50% of 2 steres = 1 stere
      expect(result.peakConsumption).toBeCloseTo(1.0, 2)
    })

    it('should count total reloads', () => {
      const rack = createRack()
      const entries = [
        createEntry({ weekNumber: 1, year: 2024, type: 'reload', percentage: 100 }),
        createEntry({ weekNumber: 3, year: 2024, type: 'reload', percentage: 100 }),
        createEntry({ weekNumber: 5, year: 2024, type: 'reload', percentage: 100 }),
      ]

      const result = calculateYearlyStats(entries, rack, 2024)

      expect(result.totalReloads).toBe(3)
    })
  })

  describe('calculateCurrentLevel', () => {
    it('should return 0 for empty entries', () => {
      expect(calculateCurrentLevel([])).toBe(0)
    })

    it('should calculate level after reload', () => {
      const entries = [createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 10) })]

      expect(calculateCurrentLevel(entries)).toBe(100)
    })

    it('should calculate level after consumption', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 30, date: new Date(2024, 0, 15) }),
      ]

      expect(calculateCurrentLevel(entries)).toBe(70) // 100 - 30
    })

    it('should calculate level after multiple consumptions', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 20, date: new Date(2024, 0, 12) }),
        createEntry({ type: 'consumption', percentage: 30, date: new Date(2024, 0, 15) }),
      ]

      expect(calculateCurrentLevel(entries)).toBe(50) // 100 - 20 - 30
    })

    it('should add level on new reload', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 50, date: new Date(2024, 0, 12) }),
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 15) }),
        createEntry({ type: 'consumption', percentage: 20, date: new Date(2024, 0, 17) }),
      ]

      // 0 + 100 = 100, -50 = 50, +100 = 150 (capped at 100), -20 = 80
      expect(calculateCurrentLevel(entries)).toBe(80)
    })

    it('should not go below 0', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 50, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 80, date: new Date(2024, 0, 15) }),
      ]

      expect(calculateCurrentLevel(entries)).toBe(0) // 50 - 80 = -30, capped at 0
    })

    it('should handle partial reload', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 100, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 60, date: new Date(2024, 0, 12) }),
        createEntry({ type: 'reload', percentage: 80, date: new Date(2024, 0, 15) }),
      ]

      // 0 + 100 = 100, -60 = 40, +80 = 120 (capped at 100)
      expect(calculateCurrentLevel(entries)).toBe(100)
    })

    it('should add small reload to current level', () => {
      const entries = [
        createEntry({ type: 'reload', percentage: 70, date: new Date(2024, 0, 10) }),
        createEntry({ type: 'consumption', percentage: 50, date: new Date(2024, 0, 12) }),
        createEntry({ type: 'reload', percentage: 5, date: new Date(2024, 0, 15) }),
      ]

      // 0 + 70 = 70, -50 = 20, +5 = 25
      expect(calculateCurrentLevel(entries)).toBe(25)
    })
  })
})
