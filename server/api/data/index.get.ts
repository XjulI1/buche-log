import { and, asc, eq, isNull } from 'drizzle-orm'
import type { ExportData } from '#shared/types'
import { consumptions, racks } from '../../database/schema'
import { consumptionRowToApi, rackRowToApi } from '../../utils/mappers'

/** Export de toutes les donnees de l'utilisateur */
export default defineEventHandler(async (event): Promise<ExportData> => {
  const user = await requireAuth(event)
  const db = useDb()

  const [rackRows, consumptionRows] = await Promise.all([
    db
      .select()
      .from(racks)
      .where(and(eq(racks.userId, user.id), isNull(racks.deletedAt)))
      .orderBy(asc(racks.createdAt)),
    db
      .select()
      .from(consumptions)
      .where(and(eq(consumptions.userId, user.id), isNull(consumptions.deletedAt)))
      .orderBy(asc(consumptions.date), asc(consumptions.createdAt)),
  ])

  return {
    version: 2,
    exportDate: new Date().toISOString(),
    racks: rackRows.map(rackRowToApi),
    consumptions: consumptionRows.map(consumptionRowToApi),
  }
})
