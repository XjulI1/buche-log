import { and, eq, isNull } from 'drizzle-orm'
import type { LogSize } from '#shared/types'
import { racks } from '../../database/schema'
import { rackRowToApi } from '../../utils/mappers'

interface UpdateRackBody {
  name: string
  height: number
  width: number
  depth: number
  logSize: LogSize
  volumeM3: number
  volumeSteres: number
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<UpdateRackBody>(event)
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
    .set({
      name: body.name,
      height: String(body.height),
      width: String(body.width),
      depth: String(body.depth),
      logSize: String(body.logSize) as '25' | '33' | '50',
      volumeM3: String(body.volumeM3),
      volumeSteres: String(body.volumeSteres),
      updatedAt: new Date(),
    })
    .where(and(eq(racks.id, id), eq(racks.userId, user.id)))

  const [row] = await db.select().from(racks).where(eq(racks.id, id)).limit(1)
  return rackRowToApi(row!)
})
