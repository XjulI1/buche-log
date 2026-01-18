import { describe, it, expect } from 'vitest'
import {
  getISOWeek,
  getWeekStartDate,
  getWeekEndDate,
  getWeeksInYear,
  formatWeek,
} from '../week'

describe('week calculations', () => {
  describe('getISOWeek', () => {
    it('should return week 1 for January 1st 2024 (Monday)', () => {
      const result = getISOWeek(new Date(2024, 0, 1))
      expect(result).toEqual({ week: 1, year: 2024 })
    })

    it('should return week 52 for December 31st 2023 (Sunday)', () => {
      const result = getISOWeek(new Date(2023, 11, 31))
      expect(result).toEqual({ week: 52, year: 2023 })
    })

    it('should return week 1 of next year for late December', () => {
      // December 30, 2024 is a Monday in week 1 of 2025
      const result = getISOWeek(new Date(2024, 11, 30))
      expect(result).toEqual({ week: 1, year: 2025 })
    })

    it('should handle mid-year dates', () => {
      // June 15, 2024 is a Saturday in week 24
      const result = getISOWeek(new Date(2024, 5, 15))
      expect(result).toEqual({ week: 24, year: 2024 })
    })

    it('should handle January dates that belong to previous year', () => {
      // January 1, 2023 is a Sunday in week 52 of 2022
      const result = getISOWeek(new Date(2023, 0, 1))
      expect(result).toEqual({ week: 52, year: 2022 })
    })
  })

  describe('getWeekStartDate', () => {
    it('should return Monday of week 1 in 2024', () => {
      const result = getWeekStartDate(2024, 1)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(1)
      expect(result.getUTCDay()).toBe(1) // Monday
    })

    it('should return Monday of week 10 in 2024', () => {
      const result = getWeekStartDate(2024, 10)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(2) // March
      expect(result.getUTCDate()).toBe(4)
      expect(result.getUTCDay()).toBe(1) // Monday
    })

    it('should return Monday of week 52 in 2024', () => {
      const result = getWeekStartDate(2024, 52)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(11) // December
      expect(result.getUTCDate()).toBe(23)
      expect(result.getUTCDay()).toBe(1) // Monday
    })
  })

  describe('getWeekEndDate', () => {
    it('should return Sunday of week 1 in 2024', () => {
      const result = getWeekEndDate(2024, 1)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(7)
      expect(result.getUTCDay()).toBe(0) // Sunday
    })

    it('should return Sunday of week 10 in 2024', () => {
      const result = getWeekEndDate(2024, 10)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(2) // March
      expect(result.getUTCDate()).toBe(10)
      expect(result.getUTCDay()).toBe(0) // Sunday
    })
  })

  describe('getWeeksInYear', () => {
    it('should return 52 weeks for 2024', () => {
      expect(getWeeksInYear(2024)).toBe(52)
    })

    it('should return 52 weeks for 2023', () => {
      expect(getWeeksInYear(2023)).toBe(52)
    })

    it('should return 52 weeks for 2025', () => {
      expect(getWeeksInYear(2025)).toBe(52)
    })

    it('should return 53 weeks for years with 53 weeks', () => {
      // 2020 has 53 weeks
      expect(getWeeksInYear(2020)).toBe(53)
    })
  })

  describe('formatWeek', () => {
    it('should format single digit week', () => {
      expect(formatWeek(1, 2024)).toBe('S01 2024')
    })

    it('should format double digit week', () => {
      expect(formatWeek(52, 2024)).toBe('S52 2024')
    })

    it('should format week 10', () => {
      expect(formatWeek(10, 2025)).toBe('S10 2025')
    })
  })
})
