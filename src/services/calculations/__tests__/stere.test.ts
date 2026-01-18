import { describe, it, expect } from 'vitest'
import {
  calculateVolumeM3,
  calculateSteres,
  calculateConsumptionSteres,
  calculateRemainingSteres,
  getLogSizeCoefficient,
} from '../stere'

describe('stere calculations', () => {
  describe('calculateVolumeM3', () => {
    it('should calculate volume in cubic meters', () => {
      // 100cm x 100cm x 100cm = 1m3
      expect(calculateVolumeM3(100, 100, 100)).toBe(1)
    })

    it('should handle typical rack dimensions', () => {
      // 150cm x 100cm x 50cm = 0.75m3
      expect(calculateVolumeM3(150, 100, 50)).toBe(0.75)
    })

    it('should handle small dimensions', () => {
      // 50cm x 50cm x 40cm = 0.1m3
      expect(calculateVolumeM3(50, 50, 40)).toBe(0.1)
    })

    it('should return 0 for zero dimensions', () => {
      expect(calculateVolumeM3(0, 100, 100)).toBe(0)
      expect(calculateVolumeM3(100, 0, 100)).toBe(0)
      expect(calculateVolumeM3(100, 100, 0)).toBe(0)
    })
  })

  describe('getLogSizeCoefficient', () => {
    it('should return 0.6 for 25cm logs', () => {
      expect(getLogSizeCoefficient(25)).toBe(0.6)
    })

    it('should return 0.7 for 33cm logs', () => {
      expect(getLogSizeCoefficient(33)).toBe(0.7)
    })

    it('should return 0.8 for 50cm logs', () => {
      expect(getLogSizeCoefficient(50)).toBe(0.8)
    })
  })

  describe('calculateSteres', () => {
    it('should calculate steres for 25cm logs', () => {
      // 1m3 / 0.6 = 1.666... steres
      const result = calculateSteres(100, 100, 100, 25)
      expect(result).toBeCloseTo(1.6667, 3)
    })

    it('should calculate steres for 33cm logs', () => {
      // 1m3 / 0.7 = 1.428... steres
      const result = calculateSteres(100, 100, 100, 33)
      expect(result).toBeCloseTo(1.4286, 3)
    })

    it('should calculate steres for 50cm logs', () => {
      // 1m3 / 0.8 = 1.25 steres
      const result = calculateSteres(100, 100, 100, 50)
      expect(result).toBe(1.25)
    })

    it('should calculate steres for typical rack', () => {
      // 150cm x 100cm x 50cm = 0.75m3
      // 0.75m3 / 0.7 (33cm logs) = 1.0714... steres
      const result = calculateSteres(150, 100, 50, 33)
      expect(result).toBeCloseTo(1.0714, 3)
    })
  })

  describe('calculateConsumptionSteres', () => {
    it('should calculate consumption for 100%', () => {
      expect(calculateConsumptionSteres(2.5, 100)).toBe(2.5)
    })

    it('should calculate consumption for 50%', () => {
      expect(calculateConsumptionSteres(2.5, 50)).toBe(1.25)
    })

    it('should calculate consumption for 0%', () => {
      expect(calculateConsumptionSteres(2.5, 0)).toBe(0)
    })

    it('should calculate consumption for 25%', () => {
      expect(calculateConsumptionSteres(2, 25)).toBe(0.5)
    })
  })

  describe('calculateRemainingSteres', () => {
    it('should calculate remaining for 100%', () => {
      expect(calculateRemainingSteres(2.5, 100)).toBe(2.5)
    })

    it('should calculate remaining for 50%', () => {
      expect(calculateRemainingSteres(2.5, 50)).toBe(1.25)
    })

    it('should calculate remaining for 0%', () => {
      expect(calculateRemainingSteres(2.5, 0)).toBe(0)
    })

    it('should calculate remaining for 75%', () => {
      expect(calculateRemainingSteres(2, 75)).toBe(1.5)
    })
  })
})
