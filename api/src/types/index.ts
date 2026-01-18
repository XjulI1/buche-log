export type LogSize = 25 | 33 | 50
export type ConsumptionType = 'reload' | 'consumption'

// Database row types (snake_case - matching MariaDB columns)
export interface UserRow {
  id: string
  email: string
  password_hash: string
  api_token: string | null
  created_at: Date
  updated_at: Date
}

export interface RackRow {
  id: string
  user_id: string
  name: string
  height: number
  width: number
  depth: number
  log_size: LogSize
  volume_m3: number
  volume_steres: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface ConsumptionRow {
  id: string
  user_id: string
  rack_id: string
  type: ConsumptionType
  percentage: number
  date: Date
  week_number: number
  year: number
  notes: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

// API types (camelCase - matching frontend)
export interface Rack {
  id: string
  name: string
  height: number
  width: number
  depth: number
  logSize: LogSize
  volumeM3: number
  volumeSteres: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface ConsumptionEntry {
  id: string
  rackId: string
  type: ConsumptionType
  percentage: number
  date: Date
  weekNumber: number
  year: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

// Mappers
export function rackRowToApi(row: RackRow): Rack {
  return {
    id: row.id,
    name: row.name,
    height: row.height,
    width: row.width,
    depth: row.depth,
    logSize: row.log_size,
    volumeM3: row.volume_m3,
    volumeSteres: row.volume_steres,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

export function consumptionRowToApi(row: ConsumptionRow): ConsumptionEntry {
  return {
    id: row.id,
    rackId: row.rack_id,
    type: row.type,
    percentage: row.percentage,
    date: row.date,
    weekNumber: row.week_number,
    year: row.year,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

// Sync types
export interface SyncItem<T> {
  data: T
  action: 'create' | 'update' | 'delete'
  localUpdatedAt: string
}

export interface SyncRequest {
  lastSyncTimestamp: string | null
  racks: SyncItem<Rack>[]
  consumptions: SyncItem<ConsumptionEntry>[]
}

export interface SyncResponse {
  serverTimestamp: string
  racks: {
    created: Rack[]
    updated: Rack[]
    deleted: string[]
  }
  consumptions: {
    created: ConsumptionEntry[]
    updated: ConsumptionEntry[]
    deleted: string[]
  }
  conflicts: ConflictResolution[]
}

export interface ConflictResolution {
  entityType: 'rack' | 'consumption'
  entityId: string
  winner: 'local' | 'server'
  resolvedData: Rack | ConsumptionEntry
}
