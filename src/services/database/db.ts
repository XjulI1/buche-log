import Dexie, { type EntityTable } from 'dexie'
import type { Rack, ConsumptionEntry } from '@/types'

const db = new Dexie('BucheLogDB') as Dexie & {
  racks: EntityTable<Rack, 'id'>
  consumptions: EntityTable<ConsumptionEntry, 'id'>
}

db.version(1).stores({
  racks: 'id, name, createdAt',
  consumptions: 'id, rackId, type, date, [year+weekNumber], createdAt',
})

export { db }
