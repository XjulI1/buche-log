import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { racks } from '../../database/schema'
import { parseRackInput } from '../../utils/inputs'
import { rackRowToApi } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const input = parseRackInput(await readBody(event))

  const id = uuidv4()
  const now = new Date()
  const db = useDb()

  await db.insert(racks).values({
    id,
    userId: user.id,
    ...input,
    createdAt: now,
    updatedAt: now,
  })

  const [row] = await db.select().from(racks).where(eq(racks.id, id)).limit(1)
  setResponseStatus(event, 201)
  return rackRowToApi(row!)
})
