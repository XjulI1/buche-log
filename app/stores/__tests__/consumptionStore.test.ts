import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsumptionStore } from '../consumptionStore'
import { useRackStore } from '../rackStore'
import { apiClient } from '~/services/api'
import type { ConsumptionEntry, ConsumptionFormData, Rack } from '#shared/types'

vi.mock('~/services/api', () => ({
  apiClient: {
    getConsumptions: vi.fn(),
    createConsumption: vi.fn(),
    updateConsumption: vi.fn(),
    deleteConsumption: vi.fn(),
  },
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
    level: 80,
    date: new Date('2024-01-15'),
    weekNumber: 3,
    year: 2024,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  }

  const mockFormData: ConsumptionFormData = {
    level: 80,
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
      vi.mocked(apiClient.getConsumptions).mockResolvedValue([mockEntry])

      const store = useConsumptionStore()
      await store.loadEntries()

      expect(apiClient.getConsumptions).toHaveBeenCalledWith('rack-1')
      expect(store.entries).toEqual([mockEntry])
    })

    it('should not load if no rack exists', async () => {
      const store = useConsumptionStore()
      await store.loadEntries()

      expect(apiClient.getConsumptions).not.toHaveBeenCalled()
    })

    it('should handle loading errors', async () => {
      setupRackStore()
      vi.mocked(apiClient.getConsumptions).mockRejectedValue(new Error('Load failed'))

      const store = useConsumptionStore()
      await store.loadEntries()

      expect(store.error).toBe('Load failed')
    })
  })

  describe('addEntry', () => {
    it('should add a new entry', async () => {
      setupRackStore()
      vi.mocked(apiClient.createConsumption).mockResolvedValue(mockEntry)

      const store = useConsumptionStore()
      await store.addEntry(mockFormData)

      expect(apiClient.createConsumption).toHaveBeenCalledWith('rack-1', mockFormData)
      expect(store.entries).toContainEqual(mockEntry)
    })

    it('should not add if no rack exists', async () => {
      const store = useConsumptionStore()
      await store.addEntry(mockFormData)

      expect(apiClient.createConsumption).not.toHaveBeenCalled()
    })

    it('should handle creation errors', async () => {
      setupRackStore()
      vi.mocked(apiClient.createConsumption).mockRejectedValue(new Error('Create failed'))

      const store = useConsumptionStore()

      await expect(store.addEntry(mockFormData)).rejects.toThrow('Create failed')
      expect(store.error).toBe('Create failed')
    })
  })

  describe('deleteEntry', () => {
    it('should delete an entry', async () => {
      setupRackStore()
      vi.mocked(apiClient.deleteConsumption).mockResolvedValue(undefined)

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await store.deleteEntry('entry-1')

      expect(apiClient.deleteConsumption).toHaveBeenCalledWith('entry-1')
      expect(store.entries).toEqual([])
    })

    it('should handle deletion errors', async () => {
      vi.mocked(apiClient.deleteConsumption).mockRejectedValue(new Error('Delete failed'))

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await expect(store.deleteEntry('entry-1')).rejects.toThrow('Delete failed')
      expect(store.error).toBe('Delete failed')
    })
  })

  describe('computed properties', () => {
    it('should calculate current level from entries', () => {
      const store = useConsumptionStore()
      store.$patch({
        entries: [
          { ...mockEntry, id: 'a', level: 100, date: new Date('2024-01-10') },
          { ...mockEntry, id: 'c', level: 50, date: new Date('2024-01-20') },
          { ...mockEntry, id: 'b', level: 70, date: new Date('2024-01-15') },
        ],
      })

      // Niveau du releve le plus recent
      expect(store.currentLevel).toBe(50)
      expect(store.consumptions.get('b')).toBe(30)
      expect(store.consumptions.get('c')).toBe(20)
    })

    it('should calculate remaining steres', () => {
      setupRackStore()

      const store = useConsumptionStore()
      store.$patch({
        entries: [
          { ...mockEntry, id: 'a', level: 100, date: new Date('2024-01-10') },
          { ...mockEntry, id: 'b', level: 50, date: new Date('2024-01-20') },
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

  describe('updateEntry', () => {
    it('should replace the updated entry', async () => {
      const updated = { ...mockEntry, level: 60, date: new Date('2024-01-08'), weekNumber: 2 }
      vi.mocked(apiClient.updateConsumption).mockResolvedValue(updated)

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      await store.updateEntry('entry-1', { level: 60, date: new Date('2024-01-08') })

      expect(apiClient.updateConsumption).toHaveBeenCalledWith('entry-1', {
        level: 60,
        date: new Date('2024-01-08'),
      })
      expect(store.entries).toEqual([updated])
    })
  })

  describe('previousEntryFor', () => {
    it('should ignore the entry being edited', () => {
      const store = useConsumptionStore()
      const older = { ...mockEntry, id: 'older', date: new Date('2024-01-08') }
      store.$patch({ entries: [older, mockEntry] })

      expect(store.previousEntryFor(new Date('2024-01-15'), 'entry-1')?.id).toBe('older')
    })
  })

  describe('getSeasonStats', () => {
    it('should return season stats when rack exists', () => {
      setupRackStore()

      const store = useConsumptionStore()
      store.$patch({ entries: [mockEntry] })

      const stats = store.getSeasonStats(2023)

      expect(stats).not.toBeNull()
      expect(stats?.season).toBe(2023)
      expect(stats?.readingsCount).toBe(1)
    })

    it('should return null when no rack exists', () => {
      const store = useConsumptionStore()

      expect(store.getSeasonStats(2023)).toBeNull()
    })
  })
})
