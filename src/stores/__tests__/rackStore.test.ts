import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRackStore } from '../rackStore'
import * as rackRepo from '@/services/database/rackRepository'
import type { Rack, RackFormData } from '@/types'

vi.mock('@/services/database/rackRepository')

describe('rackStore', () => {
  const mockRack: Rack = {
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

  const mockFormData: RackFormData = {
    name: 'Test Rack',
    height: 150,
    width: 100,
    depth: 50,
    logSize: 33,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null rack initially', () => {
      const store = useRackStore()

      expect(store.rack).toBeNull()
      expect(store.hasRack).toBe(false)
      expect(store.volumeSteres).toBe(0)
    })
  })

  describe('loadRack', () => {
    it('should load default rack', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(mockRack)

      const store = useRackStore()
      await store.loadRack()

      expect(rackRepo.getDefaultRack).toHaveBeenCalled()
      expect(store.rack).toEqual(mockRack)
      expect(store.hasRack).toBe(true)
      expect(store.volumeSteres).toBe(1.07)
    })

    it('should handle no rack found', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(undefined)

      const store = useRackStore()
      await store.loadRack()

      expect(store.rack).toBeNull()
      expect(store.hasRack).toBe(false)
    })

    it('should handle loading errors', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockRejectedValue(new Error('Database error'))

      const store = useRackStore()
      await store.loadRack()

      expect(store.error).toBe('Database error')
      expect(store.rack).toBeNull()
    })

    it('should set loading state', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRack), 10)),
      )

      const store = useRackStore()
      const promise = store.loadRack()

      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('createRack', () => {
    it('should create a new rack', async () => {
      vi.mocked(rackRepo.createRack).mockResolvedValue(mockRack)

      const store = useRackStore()
      await store.createRack(mockFormData)

      expect(rackRepo.createRack).toHaveBeenCalledWith(mockFormData)
      expect(store.rack).toEqual(mockRack)
    })

    it('should handle creation errors', async () => {
      vi.mocked(rackRepo.createRack).mockRejectedValue(new Error('Creation failed'))

      const store = useRackStore()

      await expect(store.createRack(mockFormData)).rejects.toThrow('Creation failed')
      expect(store.error).toBe('Creation failed')
    })
  })

  describe('updateRack', () => {
    it('should update existing rack', async () => {
      const updatedRack = { ...mockRack, name: 'Updated Rack' }
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(mockRack)
      vi.mocked(rackRepo.updateRack).mockResolvedValue(updatedRack)

      const store = useRackStore()
      await store.loadRack()
      await store.updateRack({ ...mockFormData, name: 'Updated Rack' })

      expect(rackRepo.updateRack).toHaveBeenCalledWith('rack-1', { ...mockFormData, name: 'Updated Rack' })
      expect(store.rack?.name).toBe('Updated Rack')
    })

    it('should not update if no rack exists', async () => {
      const store = useRackStore()
      await store.updateRack(mockFormData)

      expect(rackRepo.updateRack).not.toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(mockRack)
      vi.mocked(rackRepo.updateRack).mockRejectedValue(new Error('Update failed'))

      const store = useRackStore()
      await store.loadRack()

      await expect(store.updateRack(mockFormData)).rejects.toThrow('Update failed')
      expect(store.error).toBe('Update failed')
    })
  })

  describe('deleteRack', () => {
    it('should delete existing rack', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(mockRack)
      vi.mocked(rackRepo.deleteRack).mockResolvedValue(undefined)

      const store = useRackStore()
      await store.loadRack()
      await store.deleteRack()

      expect(rackRepo.deleteRack).toHaveBeenCalledWith('rack-1')
      expect(store.rack).toBeNull()
      expect(store.hasRack).toBe(false)
    })

    it('should not delete if no rack exists', async () => {
      const store = useRackStore()
      await store.deleteRack()

      expect(rackRepo.deleteRack).not.toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
      vi.mocked(rackRepo.getDefaultRack).mockResolvedValue(mockRack)
      vi.mocked(rackRepo.deleteRack).mockRejectedValue(new Error('Delete failed'))

      const store = useRackStore()
      await store.loadRack()

      await expect(store.deleteRack()).rejects.toThrow('Delete failed')
      expect(store.error).toBe('Delete failed')
    })
  })
})
