import { and, eq, isNull } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { consumptions, racks } from '../../database/schema'
import { parseReadingInput } from '../../utils/inputs'
import { consumptionRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ rackId?: string }>(event)
  const input = parseReadingInput(body)
  const db = useDb()

  const [rack] = await db
    .select({ id: racks.id })
    .from(racks)
    .where(
      and(eq(racks.id, String(body?.rackId)), eq(racks.userId, user.id), isNull(racks.deletedAt)),
    )
    .limit(1)

  if (!rack) {
    throw createError({ statusCode: 404, statusMessage: 'Rack not found' })
  }

  const id = uuidv4()
  const now = new Date()

  await db.insert(consumptions).values({
    id,
    userId: user.id,
    rackId: rack.id,
    ...input,
    createdAt: now,
    updatedAt: now,
  })

  const [row] = await db.select().from(consumptions).where(eq(consumptions.id, id)).limit(1)
  setResponseStatus(event, 201)
  return consumptionRowToApi(row!)
})
