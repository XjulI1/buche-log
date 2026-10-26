import { and, eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../database/schema'

/**
 * Envoie immediatement une notification de test a l'abonnement de l'appareil
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { endpoint } = await readBody<{ endpoint: string }>(event)

  const keys = useVapidKeys()
  if (!keys) {
    throw createError({ statusCode: 503, statusMessage: 'Push notifications not configured' })
  }

  const [subscription] = await useDb()
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)))
    .limit(1)

  if (!subscription) {
    throw createError({ statusCode: 404, statusMessage: 'Subscription not found' })
  }

  const status = await sendEmptyPush(subscription.endpoint, keys)
  if (status >= 400) {
    throw createError({ statusCode: 502, statusMessage: `Push service responded ${status}` })
  }

  setResponseStatus(event, 204)
  return null
})
