import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { LogSize } from '#shared/types'
import { racks } from '../../database/schema'
import { rackRowToApi } from '../../utils/mappers'

interface CreateRackBody {
  id?: string
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
  const body = await readBody<CreateRackBody>(event)

  const id = body.id || uuidv4()
  const now = new Date()
  const db = useDb()

  await db.insert(racks).values({
    id,
    userId: user.id,
    name: body.name,
    height: String(body.height),
    width: String(body.width),
    depth: String(body.depth),
    logSize: String(body.logSize) as '25' | '33' | '50',
    volumeM3: String(body.volumeM3),
    volumeSteres: String(body.volumeSteres),
    createdAt: now,
    updatedAt: now,
  })

  const [row] = await db.select().from(racks).where(eq(racks.id, id)).limit(1)
  setResponseStatus(event, 201)
  return rackRowToApi(row!)
})
