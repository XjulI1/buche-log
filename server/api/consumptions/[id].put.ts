import { and, eq, isNull } from 'drizzle-orm'
import { consumptions } from '../../database/schema'
import { parseReadingInput } from '../../utils/inputs'
import { consumptionRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const input = parseReadingInput(await readBody(event))
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

  await db
    .update(consumptions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(consumptions.id, id), eq(consumptions.userId, user.id)))

  const [row] = await db.select().from(consumptions).where(eq(consumptions.id, id)).limit(1)
  return consumptionRowToApi(row!)
})
