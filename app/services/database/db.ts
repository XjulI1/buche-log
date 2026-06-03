import Dexie, { type EntityTable } from 'dexie'
import type {
  SyncableConsumptionEntry,
  SyncableRack,
  SyncConfig,
  SyncQueueItem,
} from '#shared/types'

type SyncConfigRow = SyncConfig & { id?: number }

const db = new Dexie('BucheLogDB') as Dexie & {
  racks: EntityTable<SyncableRack, 'id'>
  consumptions: EntityTable<SyncableConsumptionEntry, 'id'>
  syncQueue: EntityTable<SyncQueueItem, 'id'>
  syncConfig: EntityTable<SyncConfigRow, 'id'>
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
    return tx
      .table('consumptions')
      .toCollection()
      .modify((entry) => {
        if (!entry.updatedAt) {
          entry.updatedAt = entry.createdAt
        }
      })
  })

// Version 3: Drop apiUrl from syncConfig (now same-origin), switch primary key to auto id
db.version(3)
  .stores({
    racks: 'id, name, createdAt, updatedAt, syncStatus, deletedAt',
    consumptions:
      'id, rackId, type, date, [year+weekNumber], createdAt, updatedAt, syncStatus, deletedAt',
    syncQueue: 'id, entityType, entityId, action, timestamp',
    syncConfig: '++id',
  })
  .upgrade(async (tx) => {
    const oldConfigs = await tx.table('syncConfig').toArray()
    await tx.table('syncConfig').clear()
    for (const cfg of oldConfigs) {
      delete cfg.apiUrl
      await tx.table('syncConfig').add(cfg)
    }
  })

export { db }
