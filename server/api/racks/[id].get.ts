import { and, eq, isNull } from 'drizzle-orm'
import { racks } from '../../database/schema'
import { rackRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const [row] = await db
    .select()
    .from(racks)
    .where(and(eq(racks.id, id), eq(racks.userId, user.id), isNull(racks.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Rack not found' })
  }

  return rackRowToApi(row)
})
