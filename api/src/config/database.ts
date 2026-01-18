import mysql, { Pool, RowDataPacket } from 'mysql2/promise'

let pool: Pool

export async function initializeDatabase(): Promise<void> {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'buche_log',
    user: process.env.DB_USER || 'buche_log_user',
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  // Test connection
  const connection = await pool.getConnection()
  connection.release()
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized')
  }
  return pool
}

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: unknown[],
): Promise<T> {
  const [rows] = await getPool().execute<T>(sql, params)
  return rows
}

export async function execute(sql: string, params?: unknown[]): Promise<void> {
  await getPool().execute(sql, params)
}
