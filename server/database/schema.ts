import { sql } from 'drizzle-orm'
import {
  date,
  datetime,
  decimal,
  index,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core'

export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    apiToken: varchar('api_token', { length: 500 }),
    createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    emailIdx: index('idx_users_email').on(t.email),
    apiTokenIdx: index('idx_users_api_token').on(t.apiToken),
  }),
)

export const racks = mysqlTable(
  'racks',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    height: decimal('height', { precision: 10, scale: 2 }).notNull(),
    width: decimal('width', { precision: 10, scale: 2 }).notNull(),
    depth: decimal('depth', { precision: 10, scale: 2 }).notNull(),
    logSize: mysqlEnum('log_size', ['25', '33', '50']).notNull(),
    volumeM3: decimal('volume_m3', { precision: 10, scale: 4 }).notNull(),
    volumeSteres: decimal('volume_steres', { precision: 10, scale: 4 }).notNull(),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
    deletedAt: datetime('deleted_at'),
  },
  (t) => ({
    userIdx: index('idx_racks_user_id').on(t.userId),
    updatedAtIdx: index('idx_racks_updated_at').on(t.updatedAt),
    deletedAtIdx: index('idx_racks_deleted_at').on(t.deletedAt),
  }),
)

export const consumptions = mysqlTable(
  'consumptions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rackId: varchar('rack_id', { length: 36 })
      .notNull()
      .references(() => racks.id, { onDelete: 'cascade' }),
    level: tinyint('level', { unsigned: true }),
    reloadFrom: tinyint('reload_from', { unsigned: true }),
    reloadTo: tinyint('reload_to', { unsigned: true }),
    // Ancien format (saisie par delta), conserve pour la migration vers `level`
    type: mysqlEnum('type', ['reload', 'consumption']),
    percentage: tinyint('percentage', { unsigned: true }),
    date: date('date').notNull(),
    weekNumber: tinyint('week_number', { unsigned: true }).notNull(),
    year: smallint('year', { unsigned: true }).notNull(),
    notes: text('notes'),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
    deletedAt: datetime('deleted_at'),
  },
  (t) => ({
    userIdx: index('idx_consumptions_user_id').on(t.userId),
    rackIdx: index('idx_consumptions_rack_id').on(t.rackId),
    yearWeekIdx: index('idx_consumptions_year_week').on(t.year, t.weekNumber),
    updatedAtIdx: index('idx_consumptions_updated_at').on(t.updatedAt),
    deletedAtIdx: index('idx_consumptions_deleted_at').on(t.deletedAt),
  }),
)

export const pushSubscriptions = mysqlTable(
  'push_subscriptions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: varchar('endpoint', { length: 500 }).notNull().unique(),
    remindDay: tinyint('remind_day', { unsigned: true }).notNull(), // 0 = dimanche
    remindHour: tinyint('remind_hour', { unsigned: true }).notNull(),
    timezone: varchar('timezone', { length: 64 }).notNull(),
    lastNotifiedAt: datetime('last_notified_at'),
    createdAt: datetime('created_at').notNull(),
  },
  (t) => ({
    userIdx: index('idx_push_subscriptions_user_id').on(t.userId),
  }),
)

export type UserRow = typeof users.$inferSelect
export type RackRow = typeof racks.$inferSelect
export type ConsumptionRow = typeof consumptions.$inferSelect
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect
