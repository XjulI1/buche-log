import { and, eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { endpoint } = await readBody<{ endpoint: string }>(event)

  await useDb()
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)))

  setResponseStatus(event, 204)
  return null
})
