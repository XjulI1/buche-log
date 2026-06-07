import { and, eq, isNull } from 'drizzle-orm'
import type { ConsumptionType } from '#shared/types'
import { consumptions } from '../../database/schema'
import { consumptionRowToApi } from '../../utils/mappers'

interface UpdateConsumptionBody {
  type: ConsumptionType
  percentage: number
  date: string | Date
  weekNumber: number
  year: number
  notes?: string | null
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<UpdateConsumptionBody>(event)
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
    .set({
      type: body.type,
      percentage: body.percentage,
      date: new Date(body.date),
      weekNumber: body.weekNumber,
      year: body.year,
      notes: body.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(consumptions.id, id), eq(consumptions.userId, user.id)))

  const [row] = await db.select().from(consumptions).where(eq(consumptions.id, id)).limit(1)
  return consumptionRowToApi(row!)
})
