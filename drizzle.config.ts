import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST ?? 'localhost',
    port: Number(process.env.NUXT_DB_PORT ?? 3306),
    database: process.env.NUXT_DB_NAME ?? 'buche_log',
    user: process.env.NUXT_DB_USER ?? 'buche_log_user',
    password: process.env.NUXT_DB_PASSWORD ?? '',
  },
})
