import { v4 as uuidv4 } from 'uuid'
import type { ImportResult } from '#shared/types'
import { consumptions, racks } from '../../database/schema'
import { softDeleteUserData } from '../../utils/userData'
import { prepareImport } from '../../utils/importData'

/** Import d'un export : remplace toutes les donnees de l'utilisateur */
export default defineEventHandler(async (event): Promise<ImportResult> => {
  const user = await requireAuth(event)
  const now = new Date()
  const rows = prepareImport(await readBody(event), user.id, now, uuidv4)

  await useDb().transaction(async (tx) => {
    await softDeleteUserData(tx, user.id, now)
    if (rows.racks.length > 0) await tx.insert(racks).values(rows.racks)
    if (rows.consumptions.length > 0) await tx.insert(consumptions).values(rows.consumptions)
  })

  return { racks: rows.racks.length, consumptions: rows.consumptions.length }
})
