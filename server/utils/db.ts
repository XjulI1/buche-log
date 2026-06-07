import type { Pool } from 'mysql2/promise'
import mysql from 'mysql2/promise'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '../database/schema'

let _pool: Pool | undefined
let _db: MySql2Database<typeof schema> | undefined

export function useDb(): MySql2Database<typeof schema> {
  if (!_db) {
    const cfg = useRuntimeConfig()
    _pool = mysql.createPool({
      host: cfg.dbHost,
      port: Number(cfg.dbPort),
      database: cfg.dbName,
      user: cfg.dbUser,
      password: cfg.dbPassword,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
    _db = drizzle(_pool, { schema, mode: 'default' })
  }
  return _db
}
