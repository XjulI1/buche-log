import { v4 as uuidv4 } from 'uuid'
import { pushSubscriptions } from '../../database/schema'

interface SubscribeBody {
  endpoint: string
  remindDay: number
  remindHour: number
  timezone: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<SubscribeBody>(event)

  const validDay = Number.isInteger(body.remindDay) && body.remindDay >= 0 && body.remindDay <= 6
  const validHour = Number.isInteger(body.remindHour) && body.remindHour >= 0 && body.remindHour <= 23
  let validEndpoint = false
  try {
    validEndpoint = new URL(body.endpoint).protocol === 'https:' && body.endpoint.length <= 500
  } catch {
    // URL invalide
  }
  let validTimezone = false
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: body.timezone })
    validTimezone = true
  } catch {
    // Fuseau inconnu
  }

  if (!validDay || !validHour || !validEndpoint || !validTimezone) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid subscription' })
  }

  const values = {
    userId: user.id,
    remindDay: body.remindDay,
    remindHour: body.remindHour,
    timezone: body.timezone,
  }

  await useDb()
    .insert(pushSubscriptions)
    .values({ id: uuidv4(), endpoint: body.endpoint, createdAt: new Date(), ...values })
    .onDuplicateKeyUpdate({ set: values })

  setResponseStatus(event, 204)
  return null
})
