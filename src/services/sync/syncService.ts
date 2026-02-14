import { db } from '@/services/database/db'
import { apiClient } from './apiClient'
import type {
  SyncableRack,
  SyncableConsumptionEntry,
  SyncQueueItem,
  SyncConfig,
  SyncStatus,
  SyncRequest,
} from '@/types'

class SyncService {
  private config: SyncConfig | null = null
  private syncInProgress = false
  private onlineListener: (() => void) | null = null
  private offlineListener: (() => void) | null = null

  async initialize(): Promise<void> {
    this.config = await this.loadConfig()
    this.setupOnlineListener()

    if (this.config?.apiToken) {
      apiClient.configure(this.config.apiUrl, this.config.apiToken)
    }

    if (navigator.onLine && this.config?.enabled) {
      await this.sync()
    }
  }

  private async loadConfig(): Promise<SyncConfig | null> {
    const configs = await db.syncConfig.toArray()
    return configs[0] || null
  }

  async configure(apiUrl: string, apiToken: string): Promise<void> {
    this.config = {
      apiUrl,
      apiToken,
      enabled: true,
      lastSyncTimestamp: null,
    }
    await db.syncConfig.clear()
    await db.syncConfig.add(this.config)
    apiClient.configure(apiUrl, apiToken)
  }

  async disable(): Promise<void> {
    if (this.config) {
      this.config.enabled = false
      await db.syncConfig.clear()
      await db.syncConfig.add(this.config)
    }
  }

  async enable(): Promise<void> {
    if (this.config) {
      this.config.enabled = true
      await db.syncConfig.clear()
      await db.syncConfig.add(this.config)
    }
  }

  isConfigured(): boolean {
    return !!this.config?.apiToken
  }

  isEnabled(): boolean {
    return this.config?.enabled ?? false
  }

  private setupOnlineListener(): void {
    this.onlineListener = () => {
      if (this.config?.enabled) {
        this.sync()
      }
    }
    this.offlineListener = () => {
      // Could emit event for UI update
    }
    window.addEventListener('online', this.onlineListener)
    window.addEventListener('offline', this.offlineListener)
  }

  async queueChange(
    entityType: 'rack' | 'consumption',
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data: SyncableRack | SyncableConsumptionEntry,
  ): Promise<void> {
    // Check if there's already a pending change for this entity
    const existing = await db.syncQueue
      .where({ entityType, entityId })
      .first()

    if (existing) {
      // Update existing queue item
      if (action === 'delete') {
        // If creating then deleting, remove from queue entirely
        if (existing.action === 'create') {
          await db.syncQueue.delete(existing.id)
          return
        }
        // Otherwise update to delete
        await db.syncQueue.update(existing.id, {
          action: 'delete',
          data,
          timestamp: new Date(),
        })
      } else {
        // Update the data
        await db.syncQueue.update(existing.id, {
          action: existing.action === 'create' ? 'create' : 'update',
          data,
          timestamp: new Date(),
        })
      }
    } else {
      const queueItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        entityType,
        entityId,
        action,
        data,
        timestamp: new Date(),
        retryCount: 0,
      }
      await db.syncQueue.add(queueItem)
    }

    // Trigger immediate sync if online and enabled
    if (navigator.onLine && this.config?.enabled) {
      await this.sync()
    }
  }

  async sync(): Promise<void> {
    if (this.syncInProgress || !this.config?.apiToken || !this.config?.enabled) {
      return
    }

    this.syncInProgress = true

    try {
      const pendingChanges = await db.syncQueue.toArray()

      const syncRequest: SyncRequest = {
        lastSyncTimestamp: this.config.lastSyncTimestamp?.toISOString() || null,
        racks: pendingChanges
          .filter((c) => c.entityType === 'rack')
          .map((c) => ({
            data: c.data as SyncableRack,
            action: c.action,
            localUpdatedAt: (c.data as SyncableRack).updatedAt.toISOString(),
          })),
        consumptions: pendingChanges
          .filter((c) => c.entityType === 'consumption')
          .map((c) => ({
            data: c.data as SyncableConsumptionEntry,
            action: c.action,
            localUpdatedAt: (c.data as SyncableConsumptionEntry).updatedAt.toISOString(),
          })),
      }

      const syncResponse = await apiClient.sync(syncRequest)

      await this.applyServerChanges(syncResponse)

      await db.syncQueue.clear()

      this.config.lastSyncTimestamp = new Date(syncResponse.serverTimestamp)
      await db.syncConfig.clear()
      await db.syncConfig.add(this.config)
    } catch (error) {
      console.error('Sync error:', error)
      // Queue items remain for retry
    } finally {
      this.syncInProgress = false
    }
  }

  private async applyServerChanges(syncResponse: {
    racks: { created: SyncableRack[]; updated: SyncableRack[]; deleted: string[] }
    consumptions: {
      created: SyncableConsumptionEntry[]
      updated: SyncableConsumptionEntry[]
      deleted: string[]
    }
  }): Promise<void> {
    await db.transaction('rw', [db.racks, db.consumptions], async () => {
      // Apply rack changes
      for (const rack of syncResponse.racks.created) {
        const existing = await db.racks.get(rack.id)
        if (!existing) {
          await db.racks.put(this.deserializeRack(rack))
        }
      }
      for (const rack of syncResponse.racks.updated) {
        await db.racks.put(this.deserializeRack(rack))
      }
      for (const id of syncResponse.racks.deleted) {
        await db.racks.delete(id)
      }

      // Apply consumption changes
      for (const consumption of syncResponse.consumptions.created) {
        const existing = await db.consumptions.get(consumption.id)
        if (!existing) {
          await db.consumptions.put(this.deserializeConsumption(consumption))
        }
      }
      for (const consumption of syncResponse.consumptions.updated) {
        await db.consumptions.put(this.deserializeConsumption(consumption))
      }
      for (const id of syncResponse.consumptions.deleted) {
        await db.consumptions.delete(id)
      }
    })
  }

  private deserializeRack(rack: SyncableRack): SyncableRack {
    return {
      ...rack,
      height: Number(rack.height),
      width: Number(rack.width),
      depth: Number(rack.depth),
      logSize: Number(rack.logSize),
      volumeM3: Number(rack.volumeM3),
      volumeSteres: Number(rack.volumeSteres),
      createdAt: new Date(rack.createdAt),
      updatedAt: new Date(rack.updatedAt),
      deletedAt: rack.deletedAt ? new Date(rack.deletedAt) : null,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    }
  }

  private deserializeConsumption(
    consumption: SyncableConsumptionEntry,
  ): SyncableConsumptionEntry {
    return {
      ...consumption,
      percentage: Number(consumption.percentage),
      weekNumber: Number(consumption.weekNumber),
      year: Number(consumption.year),
      date: new Date(consumption.date),
      createdAt: new Date(consumption.createdAt),
      updatedAt: new Date(consumption.updatedAt),
      deletedAt: consumption.deletedAt ? new Date(consumption.deletedAt) : null,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    }
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingChanges = await db.syncQueue.count()

    return {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      pendingChanges,
      lastSyncAt: this.config?.lastSyncTimestamp || null,
      lastError: null,
    }
  }

  async clearQueue(): Promise<void> {
    await db.syncQueue.clear()
  }

  async logout(): Promise<void> {
    await db.syncConfig.clear()
    await db.syncQueue.clear()
    this.config = null
    apiClient.configure('', null)
  }

  destroy(): void {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener)
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener)
    }
  }
}

export const syncService = new SyncService()
