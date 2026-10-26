import { getISOWeek } from '#shared/utils/isoWeek'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MIN_INTERVAL_MS = 20 * 3600 * 1000

export interface LocalTime {
  day: number // 0 = dimanche
  hour: number
  date: Date // date locale (minuit), pour le calcul de semaine ISO
}

export function getLocalTime(now: Date, timeZone: string): LocalTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return {
    day: WEEKDAYS.indexOf(parts.weekday!),
    hour: Number(parts.hour),
    date: new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
  }
}

export interface ReminderInput {
  now: Date
  timeZone: string
  remindDay: number
  remindHour: number
  lastNotifiedAt: Date | null
  /** Date du dernier releve de l'utilisateur (colonne DATE, sans fuseau) */
  lastReadingDate: Date | null
}

/**
 * Faut-il envoyer le rappel ? Oui si on est au jour/heure choisis (heure locale de
 * l'utilisateur), qu'aucun releve n'a ete saisi cette semaine ISO, et qu'aucun
 * rappel n'est parti dans les 20 dernieres heures.
 */
export function shouldRemind(input: ReminderInput): boolean {
  const local = getLocalTime(input.now, input.timeZone)
  if (local.day !== input.remindDay || local.hour !== input.remindHour) return false

  if (input.lastNotifiedAt && input.now.getTime() - input.lastNotifiedAt.getTime() < MIN_INTERVAL_MS) {
    return false
  }

  if (input.lastReadingDate) {
    const current = getISOWeek(local.date)
    const last = getISOWeek(input.lastReadingDate)
    if (current.week === last.week && current.year === last.year) return false
  }

  return true
}
