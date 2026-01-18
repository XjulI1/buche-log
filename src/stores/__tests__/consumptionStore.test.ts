import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsumptionStore } from '../consumptionStore'
import { useRackStore } from '../rackStore'
import * as consumptionRepo from '@/services/database/consumptionRepository'
import type { ConsumptionEntry, ConsumptionFormData, Rack } from '@/types'

vi.mock('@/services/database/consumptionRepository')
vi.mock('@/services/database/rackRepository', () => ({
  getDefaultRack: vi.fn(),
}))

describe('consumptionStore', () => {
  const mockRack: Rack = {
    id: 'rack-1',
    name: 'Test Rack',
    height: 150,
    width: 100,
    depth: 50,
    logSize: 33,
    volumeM3: 0.75,
    volumeSteres: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockEntry: ConsumptionEntry = {
    id: 'entry-1',
    rackId: 'rack-1',
    type: 'consumption',
    percentage: 20,
    date: new Date('2024-01-15'),
    weekNumber: 3,
    year: 2024,
    createdAt: new Date('2024-01-15'),
  }

  const mockFormData: ConsumptionFormData = {
    type: 'consumption',
    percentage: 20,
    date: new Date('2024-01-15'),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function setupRackStore() {
    const rackStore = useRackStore()
    rackStore.$patch({ rack: mockRack })
    return rackStore
  }

  describe('initial state', () => {
    it('should have empty entries initially', () => {
      const store = useConsumptionStore()

      expect(store.entries).toEqual([])
      expect(store.currentLevel).toBe(0) // No entries = 0 level
      expect(store.remainingSteres).toBe(0)
      expect(store.lastEntry).toBeNull()
    })
  })

  describe('loadEntries', () => {
    it('should load entries for current rack', async () => {
      setupRackStore()
      vi.mocked(consumptionRepo.getConsumptionsByRack).mockResolvedValue([mockEntry])

      const store = useConsumptionStore()
      await store.loadEntries()

      expect(consumptionRepo.getConsumptionsByRack).toHaveBeenCalledWith('rack-1')
      expect(store.entries).toEqual([mockEntry])
    })

    it('should not load if no rack exists', async () => {
      const store = useConsumptionStore()
      await store.loadEntries()

      expect(consumptionRepo.getConsumptionsByRack).not.toHaveBeenCalled()
    })

    it('should handle loading errors', async () => {
      setupRackStore()
      vi.mocked(consumptionRepo.getConsumptionsByRack).mockRejectedValue(new Error('Load failed'))

      const store = useConsumptionStore()
      await store.loadEntries()

      expect(store.error).toBe('Load failed')
    })
  })

  describe('addEntry', () => {
    it('should add a new entry', async () => {
      setupRackStore()
      vi.mocked(consumptionRepo.createConsumption).mockResolvedValue(mockEntry)

      const store = useConsumptionStore()
      await store.addEntry(mockFormData)

      expect(consumptionRepo.createConsumption).toHaveBeenCalledWith('rack-1', mockFormData)
      expect(store.entries).toContainEqual(mockEntry)
    })

    it('should not add if no rack exists', async () => {
      const store = useConsumptionStore()
      await store.addEntry(mockFormData)

      expect(consumptionRepo.createConsumption).not.toHaveBeenCalled()
    })

    it('should handle creation errors', async () => {
      setupRackStore()
      vi.mocked(consumptionRepo.createConsumption).mockRejectedValue(new Error('Create failed'))

      const store = useConsumptionStore()

      await expect(store.addEntry(mockFormData)).rejects.toThrow('Create failed')
      expect(store.error).toBe('Create failed')
    })
  })

  describe('deleteEntry', () => {
    it('should delete an entry', async () => {
      setupRackStore()
      vi.mocked(consumptionRepo.deleteConsumption).mockResolvedValue(undefined)

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await store.deleteEntry('entry-1')

      expect(consumptionRepo.deleteConsumption).toHaveBeenCalledWith('entry-1')
      expect(store.entries).toEqual([])
    })

    it('should handle deletion errors', async () => {
      vi.mocked(consumptionRepo.deleteConsumption).mockRejectedValue(new Error('Delete failed'))

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await expect(store.deleteEntry('entry-1')).rejects.toThrow('Delete failed')
      expect(store.error).toBe('Delete failed')
    })
  })

  describe('clearAll', () => {
    it('should clear all entries', async () => {
      vi.mocked(consumptionRepo.deleteAllConsumptions).mockResolvedValue(undefined)

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await store.clearAll()

      expect(consumptionRepo.deleteAllConsumptions).toHaveBeenCalled()
      expect(store.entries).toEqual([])
    })
  })

  describe('computed properties', () => {
    it('should calculate current level from entries', () => {
      const store = useConsumptionStore()
      store.$patch({
        entries: [
          { ...mockEntry, type: 'reload', percentage: 100, date: new Date('2024-01-10') },
          { ...mockEntry, type: 'consumption', percentage: 30, date: new Date('2024-01-15') },
          { ...mockEntry, type: 'consumption', percentage: 20, date: new Date('2024-01-20') },
        ],
      })

      // 100 - 30 - 20 = 50
      expect(store.currentLevel).toBe(50)
    })

    it('should calculate remaining steres', () => {
      setupRackStore()

      const store = useConsumptionStore()
      store.$patch({
        entries: [
          { ...mockEntry, type: 'reload', percentage: 100, date: new Date('2024-01-10') },
          { ...mockEntry, type: 'consumption', percentage: 50, date: new Date('2024-01-20') },
        ],
      })

      // 50% of 2 steres = 1 stere remaining
      expect(store.remainingSteres).toBe(1)
    })

    it('should return last entry', () => {
      const store = useConsumptionStore()
      const oldEntry = { ...mockEntry, id: 'entry-old', date: new Date('2024-01-10') }
      const newEntry = { ...mockEntry, id: 'entry-new', date: new Date('2024-01-20') }
      store.$patch({ entries: [oldEntry, newEntry] })

      expect(store.lastEntry?.id).toBe('entry-new')
    })
  })

  describe('getYearlyStats', () => {
    it('should return yearly stats when rack exists', () => {
      setupRackStore()

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      const stats = store.getYearlyStats(2024)

      expect(stats).not.toBeNull()
      expect(stats?.year).toBe(2024)
    })

    it('should return null when no rack exists', () => {
      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      const stats = store.getYearlyStats(2024)

      expect(stats).toBeNull()
    })
  })

  describe('getWeeklyStats', () => {
    it('should return weekly stats when rack exists', () => {
      setupRackStore()

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      const stats = store.getWeeklyStats(3, 2024)

      expect(stats).not.toBeNull()
      expect(stats?.weekNumber).toBe(3)
      expect(stats?.year).toBe(2024)
    })

    it('should return null when no rack exists', () => {
      const store = useConsumptionStore()

      const stats = store.getWeeklyStats(3, 2024)

      expect(stats).toBeNull()
    })
  })
})
