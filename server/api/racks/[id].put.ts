import { and, eq, isNull } from 'drizzle-orm'
import { racks } from '../../database/schema'
import { parseRackInput } from '../../utils/inputs'
import { rackRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const input = parseRackInput(await readBody(event))
  const db = useDb()

  const [existing] = await db
    .select({ id: racks.id })
    .from(racks)
    .where(and(eq(racks.id, id), eq(racks.userId, user.id), isNull(racks.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rack not found' })
  }

  await db
    .update(racks)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(racks.id, id), eq(racks.userId, user.id)))

  const [row] = await db.select().from(racks).where(eq(racks.id, id)).limit(1)
  return rackRowToApi(row!)
})
