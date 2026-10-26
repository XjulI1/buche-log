import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { consumptions } from '../../database/schema'
import { consumptionRowToApi } from '../../utils/mappers'

interface CreateConsumptionBody {
  id?: string
  rackId: string
  level: number
  reloadFrom?: number | null
  reloadTo?: number | null
  date: string | Date
  weekNumber: number
  year: number
  notes?: string | null
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<CreateConsumptionBody>(event)

  const id = body.id || uuidv4()
  const now = new Date()
  const db = useDb()

  await db.insert(consumptions).values({
    id,
    userId: user.id,
    rackId: body.rackId,
    level: body.level,
    reloadFrom: body.reloadFrom ?? null,
    reloadTo: body.reloadTo ?? null,
    date: new Date(body.date),
    weekNumber: body.weekNumber,
    year: body.year,
    notes: body.notes ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const [row] = await db.select().from(consumptions).where(eq(consumptions.id, id)).limit(1)
  setResponseStatus(event, 201)
  return consumptionRowToApi(row!)
})
