import { and, desc, eq, isNull } from 'drizzle-orm'
import { consumptions } from '../../database/schema'
import { consumptionRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const rows = await db
    .select()
    .from(consumptions)
    .where(and(eq(consumptions.userId, user.id), isNull(consumptions.deletedAt)))
    .orderBy(desc(consumptions.date), desc(consumptions.createdAt))

  return rows.map(consumptionRowToApi)
})
