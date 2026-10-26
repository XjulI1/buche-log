import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExportImport } from '../useExportImport'
import { apiClient } from '~/services/api'
import type { ExportData } from '#shared/types'

vi.mock('~/services/api', () => ({
  apiClient: {
    exportData: vi.fn(),
    importData: vi.fn(),
    deleteAllData: vi.fn(),
  },
}))

describe('useExportImport', () => {
  const exportPayload: ExportData = {
    version: 2,
    exportDate: '2024-01-01T00:00:00.000Z',
    racks: [
      {
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
      },
    ],
    consumptions: [
      {
        id: 'entry-1',
        rackId: 'rack-1',
        level: 80,
        date: new Date('2024-01-15'),
        weekNumber: 3,
        year: 2024,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData', () => {
    it('should serialize the server export as JSON', async () => {
      vi.mocked(apiClient.exportData).mockResolvedValue(exportPayload)

      const { exportData } = useExportImport()
      const parsed = JSON.parse(await exportData())

      expect(parsed.version).toBe(2)
      expect(parsed.racks).toHaveLength(1)
      expect(parsed.consumptions).toHaveLength(1)
    })
  })

  describe('importData', () => {
    it('should send the parsed file to the server', async () => {
      vi.mocked(apiClient.importData).mockResolvedValue({ racks: 1, consumptions: 1 })

      const { importData } = useExportImport()
      const result = await importData(JSON.stringify(exportPayload))

      expect(apiClient.importData).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2, racks: expect.any(Array) }),
      )
      expect(result).toEqual({ racks: 1, consumptions: 1 })
    })

    it('should throw error for invalid format', async () => {
      const { importData } = useExportImport()

      await expect(importData('{}')).rejects.toThrow('Format de fichier invalide')
      await expect(importData('{"version": 1}')).rejects.toThrow('Format de fichier invalide')
      expect(apiClient.importData).not.toHaveBeenCalled()
    })
  })

  describe('resetAllData', () => {
    it('should delete the account data on the server', async () => {
      const { resetAllData } = useExportImport()
      await resetAllData()

      expect(apiClient.deleteAllData).toHaveBeenCalled()
    })
  })
})
