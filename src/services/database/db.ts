import Dexie, { type EntityTable } from 'dexie'
import type {
  SyncableRack,
  SyncableConsumptionEntry,
  SyncQueueItem,
  SyncConfig,
} from '@/types'

const db = new Dexie('BucheLogDB') as Dexie & {
  racks: EntityTable<SyncableRack, 'id'>
  consumptions: EntityTable<SyncableConsumptionEntry, 'id'>
  syncQueue: EntityTable<SyncQueueItem, 'id'>
  syncConfig: EntityTable<SyncConfig, 'apiUrl'>
}

// Version 1: Original schema
db.version(1).stores({
  racks: 'id, name, createdAt',
  consumptions: 'id, rackId, type, date, [year+weekNumber], createdAt',
})

// Version 2: Add sync support
db.version(2)
  .stores({
    racks: 'id, name, createdAt, updatedAt, syncStatus, deletedAt',
    consumptions:
      'id, rackId, type, date, [year+weekNumber], createdAt, updatedAt, syncStatus, deletedAt',
    syncQueue: 'id, entityType, entityId, action, timestamp',
    syncConfig: 'apiUrl',
  })
  .upgrade((tx) => {
    // Migration: add updatedAt to existing consumptions
    return tx
      .table('consumptions')
      .toCollection()
      .modify((entry) => {
        if (!entry.updatedAt) {
          entry.updatedAt = entry.createdAt
        }
      })
  })

export { db }
