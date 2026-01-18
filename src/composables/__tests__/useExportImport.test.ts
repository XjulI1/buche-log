import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExportImport } from '../useExportImport'
import { db } from '@/services/database/db'
import type { SyncableRack, SyncableConsumptionEntry } from '@/types'

// Mock the database
vi.mock('@/services/database/db', () => ({
  db: {
    racks: {
      filter: vi.fn(() => ({
        toArray: vi.fn(),
      })),
      toArray: vi.fn(),
      clear: vi.fn(),
      bulkAdd: vi.fn(),
    },
    consumptions: {
      filter: vi.fn(() => ({
        toArray: vi.fn(),
      })),
      toArray: vi.fn(),
      clear: vi.fn(),
      bulkAdd: vi.fn(),
    },
    syncQueue: {
      clear: vi.fn(),
    },
  },
}))

describe('useExportImport', () => {
  const mockRack: SyncableRack = {
    id: 'rack-1',
    name: 'Test Rack',
    height: 150,
    width: 100,
    depth: 50,
    logSize: 33,
    volumeM3: 0.75,
    volumeSteres: 1.07,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockConsumption: SyncableConsumptionEntry = {
    id: 'entry-1',
    rackId: 'rack-1',
    type: 'consumption',
    percentage: 20,
    date: new Date('2024-01-15'),
    weekNumber: 3,
    year: 2024,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData', () => {
    it('should export racks and consumptions as JSON', async () => {
      const mockFilterRacks = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([mockRack]),
      })
      const mockFilterConsumptions = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([mockConsumption]),
      })
      vi.mocked(db.racks.filter).mockImplementation(mockFilterRacks)
      vi.mocked(db.consumptions.filter).mockImplementation(mockFilterConsumptions)

      const { exportData } = useExportImport()
      const result = await exportData()
      const parsed = JSON.parse(result)

      expect(parsed.version).toBe(1)
      expect(parsed.exportDate).toBeDefined()
      expect(parsed.racks).toHaveLength(1)
      expect(parsed.consumptions).toHaveLength(1)
    })

    it('should handle empty database', async () => {
      const mockFilterRacks = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      })
      const mockFilterConsumptions = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      })
      vi.mocked(db.racks.filter).mockImplementation(mockFilterRacks)
      vi.mocked(db.consumptions.filter).mockImplementation(mockFilterConsumptions)

      const { exportData } = useExportImport()
      const result = await exportData()
      const parsed = JSON.parse(result)

      expect(parsed.racks).toHaveLength(0)
      expect(parsed.consumptions).toHaveLength(0)
    })
  })

  describe('importData', () => {
    it('should import valid JSON data', async () => {
      const importJson = JSON.stringify({
        version: 1,
        exportDate: '2024-01-01T00:00:00.000Z',
        racks: [mockRack],
        consumptions: [mockConsumption],
      })

      const { importData } = useExportImport()
      const result = await importData(importJson)

      expect(db.racks.clear).toHaveBeenCalled()
      expect(db.consumptions.clear).toHaveBeenCalled()
      expect(db.syncQueue.clear).toHaveBeenCalled()
      expect(db.racks.bulkAdd).toHaveBeenCalled()
      expect(db.consumptions.bulkAdd).toHaveBeenCalled()
      expect(result).toEqual({ racks: 1, consumptions: 1 })
    })

    it('should throw error for invalid format', async () => {
      const { importData } = useExportImport()

      await expect(importData('{}')).rejects.toThrow('Format de fichier invalide')
      await expect(importData('{"version": 1}')).rejects.toThrow('Format de fichier invalide')
    })

    it('should convert date strings to Date objects', async () => {
      const importJson = JSON.stringify({
        version: 1,
        exportDate: '2024-01-01T00:00:00.000Z',
        racks: [
          {
            ...mockRack,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        consumptions: [
          {
            ...mockConsumption,
            date: '2024-01-15T00:00:00.000Z',
            createdAt: '2024-01-15T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z',
          },
        ],
      })

      const { importData } = useExportImport()
      await importData(importJson)

      // Check that bulkAdd was called with Date objects
      const racksCall = vi.mocked(db.racks.bulkAdd).mock.calls[0]?.[0] as
        | SyncableRack[]
        | undefined
      expect(racksCall?.[0]?.createdAt).toBeInstanceOf(Date)
      expect(racksCall?.[0]?.updatedAt).toBeInstanceOf(Date)

      const consumptionsCall = vi.mocked(db.consumptions.bulkAdd).mock.calls[0]?.[0] as
        | SyncableConsumptionEntry[]
        | undefined
      expect(consumptionsCall?.[0]?.date).toBeInstanceOf(Date)
      expect(consumptionsCall?.[0]?.createdAt).toBeInstanceOf(Date)
      expect(consumptionsCall?.[0]?.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('resetAllData', () => {
    it('should clear all tables', async () => {
      const { resetAllData } = useExportImport()
      await resetAllData()

      expect(db.racks.clear).toHaveBeenCalled()
      expect(db.consumptions.clear).toHaveBeenCalled()
      expect(db.syncQueue.clear).toHaveBeenCalled()
    })
  })
})
