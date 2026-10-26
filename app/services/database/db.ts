import Dexie, { type EntityTable } from 'dexie'
import type {
  SyncableConsumptionEntry,
  SyncableRack,
  SyncConfig,
  SyncQueueItem,
} from '#shared/types'
import { convertLegacyEntries, type LegacyEntry } from '#shared/utils/legacyReadings'

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

// Version 4: Saisie par releve de niveau (level + rechargement avant/apres)
db.version(4)
  .stores({
    racks: 'id, name, createdAt, updatedAt, syncStatus, deletedAt',
    consumptions: 'id, rackId, date, [year+weekNumber], createdAt, updatedAt, syncStatus, deletedAt',
    syncQueue: 'id, entityType, entityId, action, timestamp',
    syncConfig: '++id',
  })
  .upgrade(async (tx) => {
    const table = tx.table('consumptions')
    const legacy = (await table.toArray()).filter(
      (e) => e.level === undefined && !e.deletedAt,
    ) as LegacyEntry[]
    const converted = convertLegacyEntries(legacy)

    await table.toCollection().modify((entry) => {
      if (entry.level !== undefined) return
      const reading = converted.get(entry.id) ?? { level: 0, reloadFrom: null, reloadTo: null }
      Object.assign(entry, reading)
      delete entry.type
      delete entry.percentage
    })

    // Les changements en attente de sync contiennent une copie de l'entree : on la met a jour
    const updatedEntries = new Map((await table.toArray()).map((e) => [e.id, e]))
    await tx
      .table('syncQueue')
      .toCollection()
      .modify((item) => {
        if (item.entityType === 'consumption' && updatedEntries.has(item.entityId)) {
          item.data = updatedEntries.get(item.entityId)
        }
      })
  })

export { db }
