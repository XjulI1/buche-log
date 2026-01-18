import type { Rack } from './rack'
import type { ConsumptionEntry } from './consumption'

export interface SyncableRack extends Rack {
  deletedAt?: Date | null
  syncStatus?: 'synced' | 'pending' | 'conflict'
  lastSyncedAt?: Date
}

export interface SyncableConsumptionEntry extends ConsumptionEntry {
  updatedAt: Date
  deletedAt?: Date | null
  syncStatus?: 'synced' | 'pending' | 'conflict'
  lastSyncedAt?: Date
}

export interface SyncQueueItem {
  id: string
  entityType: 'rack' | 'consumption'
  entityId: string
  action: 'create' | 'update' | 'delete'
  data: SyncableRack | SyncableConsumptionEntry
  timestamp: Date
  retryCount: number
}

export interface SyncConfig {
  apiUrl: string
  apiToken: string | null
  enabled: boolean
  lastSyncTimestamp: Date | null
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingChanges: number
  lastSyncAt: Date | null
  lastError: string | null
}

export interface SyncItem<T> {
  data: T
  action: 'create' | 'update' | 'delete'
  localUpdatedAt: string
}

export interface SyncRequest {
  lastSyncTimestamp: string | null
  racks: SyncItem<SyncableRack>[]
  consumptions: SyncItem<SyncableConsumptionEntry>[]
}

export interface SyncResponse {
  serverTimestamp: string
  racks: {
    created: SyncableRack[]
    updated: SyncableRack[]
    deleted: string[]
  }
  consumptions: {
    created: SyncableConsumptionEntry[]
    updated: SyncableConsumptionEntry[]
    deleted: string[]
  }
  conflicts: ConflictResolution[]
}

export interface ConflictResolution {
  entityType: 'rack' | 'consumption'
  entityId: string
  winner: 'local' | 'server'
  resolvedData: SyncableRack | SyncableConsumptionEntry
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}
