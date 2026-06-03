import { and, eq, isNull } from 'drizzle-orm'
import { racks } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const [existing] = await db
    .select({ id: racks.id })
    .from(racks)
    .where(and(eq(racks.id, id), eq(racks.userId, user.id), isNull(racks.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rack not found' })
  }

  const now = new Date()
  await db
    .update(racks)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(racks.id, id), eq(racks.userId, user.id)))

  setResponseStatus(event, 204)
  return null
})
