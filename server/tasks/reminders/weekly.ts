import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { consumptions, pushSubscriptions } from '../../database/schema'

/**
 * Rappel hebdomadaire : executee toutes les heures (voir `scheduledTasks` dans
 * nuxt.config.ts), elle notifie les abonnes dont c'est le jour/heure de rappel
 * et qui n'ont pas encore fait de releve cette semaine.
 */
export default defineTask({
  meta: {
    name: 'reminders:weekly',
    description: 'Envoie le rappel de releve hebdomadaire',
  },
  async run() {
    const keys = useVapidKeys()
    if (!keys) return { result: 'skipped: VAPID keys not configured' }

    const db = useDb()
    const now = new Date()
    const subscriptions = await db.select().from(pushSubscriptions)
    const lastReadingByUser = new Map<string, Date | null>()
    let sent = 0

    for (const sub of subscriptions) {
      if (!lastReadingByUser.has(sub.userId)) {
        const [last] = await db
          .select({ date: consumptions.date })
          .from(consumptions)
          .where(
            and(
              eq(consumptions.userId, sub.userId),
              isNull(consumptions.deletedAt),
              isNotNull(consumptions.level),
            ),
          )
          .orderBy(desc(consumptions.date))
          .limit(1)
        lastReadingByUser.set(sub.userId, last ? new Date(last.date) : null)
      }

      const remind = shouldRemind({
        now,
        timeZone: sub.timezone,
        remindDay: sub.remindDay,
        remindHour: sub.remindHour,
        lastNotifiedAt: sub.lastNotifiedAt,
        lastReadingDate: lastReadingByUser.get(sub.userId) ?? null,
      })
      if (!remind) continue

      try {
        const status = await sendEmptyPush(sub.endpoint, keys)
        if (status === 404 || status === 410) {
          // Abonnement expire ou revoque par le navigateur
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        } else if (status < 400) {
          await db
            .update(pushSubscriptions)
            .set({ lastNotifiedAt: now })
            .where(eq(pushSubscriptions.id, sub.id))
          sent++
        } else {
          console.warn(`[reminders] push ${sub.id} refuse (${status})`)
        }
      } catch (error) {
        console.error(`[reminders] echec d'envoi ${sub.id}`, error)
      }
    }

    return { result: `${sent} rappel(s) envoye(s)` }
  },
})
