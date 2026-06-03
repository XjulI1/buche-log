import { and, eq, isNull } from 'drizzle-orm'
import { consumptions } from '../../database/schema'
import { consumptionRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const [row] = await db
    .select()
    .from(consumptions)
    .where(
      and(eq(consumptions.id, id), eq(consumptions.userId, user.id), isNull(consumptions.deletedAt)),
    )
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Consumption not found' })
  }

  return consumptionRowToApi(row)
})
