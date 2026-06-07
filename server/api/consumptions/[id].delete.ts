import { and, eq, isNull } from 'drizzle-orm'
import { consumptions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const [existing] = await db
    .select({ id: consumptions.id })
    .from(consumptions)
    .where(
      and(eq(consumptions.id, id), eq(consumptions.userId, user.id), isNull(consumptions.deletedAt)),
    )
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Consumption not found' })
  }

  const now = new Date()
  await db
    .update(consumptions)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(consumptions.id, id), eq(consumptions.userId, user.id)))

  setResponseStatus(event, 204)
  return null
})
