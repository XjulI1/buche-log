import { and, eq, isNull } from 'drizzle-orm'
import { convertLegacyEntries, type LegacyEntry } from '#shared/utils/legacyReadings'
import { consumptions } from '../database/schema'

/**
 * Convertit au demarrage les anciennes saisies (type + percentage) en releves de niveau.
 * Idempotent : ne traite que les porte-buches qui ont encore des lignes sans `level`.
 * N'incremente pas `updated_at` : chaque client convertit ses propres donnees locales
 * avec le meme algorithme.
 */
export default defineNitroPlugin(async () => {
  if (!useRuntimeConfig().dbHost) return
  try {
    const db = useDb()
    const pending = await db
      .selectDistinct({ rackId: consumptions.rackId })
      .from(consumptions)
      .where(isNull(consumptions.level))

    for (const { rackId } of pending) {
      const rows = await db
        .select()
        .from(consumptions)
        .where(and(eq(consumptions.rackId, rackId), isNull(consumptions.deletedAt)))

      const legacy: LegacyEntry[] = rows
        .filter((r) => r.level === null && r.type !== null && r.percentage !== null)
        .map((r) => ({
          id: r.id,
          rackId: r.rackId,
          type: r.type!,
          percentage: r.percentage!,
          date: r.date,
          createdAt: r.createdAt,
        }))

      const converted = convertLegacyEntries(legacy)
      for (const [id, reading] of converted) {
        await db.update(consumptions).set(reading).where(eq(consumptions.id, id))
      }

      // Lignes supprimees : on leur donne un niveau neutre pour qu'elles restent lisibles
      await db
        .update(consumptions)
        .set({ level: 0 })
        .where(and(eq(consumptions.rackId, rackId), isNull(consumptions.level)))

      console.info(`[migrate-readings] rack ${rackId}: ${converted.size} saisies converties`)
    }
  } catch (error) {
    console.error('[migrate-readings] echec de la conversion des anciennes saisies', error)
  }
})
