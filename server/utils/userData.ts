import { and, eq, isNull } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { consumptions, racks } from '../database/schema'
import type * as schema from '../database/schema'

type Transaction = Parameters<Parameters<MySql2Database<typeof schema>['transaction']>[0]>[0]

/** Supprime (soft delete) les porte-buches et releves d'un utilisateur */
export async function softDeleteUserData(tx: Transaction, userId: string, now: Date) {
  await tx
    .update(consumptions)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(consumptions.userId, userId), isNull(consumptions.deletedAt)))
  await tx
    .update(racks)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(racks.userId, userId), isNull(racks.deletedAt)))
}
