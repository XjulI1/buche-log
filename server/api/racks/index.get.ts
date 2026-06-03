import { and, asc, eq, isNull } from 'drizzle-orm'
import { racks } from '../../database/schema'
import { rackRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const rows = await db
    .select()
    .from(racks)
    .where(and(eq(racks.userId, user.id), isNull(racks.deletedAt)))
    .orderBy(asc(racks.createdAt))

  return rows.map(rackRowToApi)
})
