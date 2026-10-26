import type { LogSize } from '#shared/types'
import { getISOWeek } from '#shared/utils/isoWeek'
import { calculateSteres, calculateVolumeM3 } from '#shared/utils/stere'

const LOG_SIZES: LogSize[] = [25, 33, 50]

/**
 * Erreur 400. h3 reprend `statusCode` / `statusMessage` de l'erreur levee ;
 * on evite `createError` pour garder ces fonctions testables hors de Nitro.
 */
export function badRequest(message: string): never {
  throw Object.assign(new Error(message), { statusCode: 400, statusMessage: message })
}

function toPositiveNumber(value: unknown, field: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) badRequest(`Invalid ${field}`)
  return n
}

function toLevel(value: unknown, field: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 100) badRequest(`Invalid ${field}`)
  return n
}

function toOptionalLevel(value: unknown, field: string): number | null {
  return value === null || value === undefined ? null : toLevel(value, field)
}

function toDate(value: unknown, field: string): Date {
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) badRequest(`Invalid ${field}`)
  return d
}

/**
 * Valide un porte-buches et calcule ses volumes (le client ne les fournit pas).
 * Les decimaux sont convertis en chaines pour Drizzle.
 */
export function parseRackInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) badRequest('Invalid name')

  const height = toPositiveNumber(b.height, 'height')
  const width = toPositiveNumber(b.width, 'width')
  const depth = toPositiveNumber(b.depth, 'depth')
  const logSize = Number(b.logSize) as LogSize
  if (!LOG_SIZES.includes(logSize)) badRequest('Invalid logSize')

  return {
    name,
    height: String(height),
    width: String(width),
    depth: String(depth),
    logSize: String(logSize) as '25' | '33' | '50',
    volumeM3: String(calculateVolumeM3(height, width, depth)),
    volumeSteres: String(calculateSteres(height, width, depth, logSize)),
  }
}

/**
 * Valide un releve de niveau.
 * La semaine ISO est fournie par le client (calculee dans son fuseau horaire) ;
 * a defaut, elle est deduite de la date.
 */
export function parseReadingInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const date = toDate(b.date, 'date')
  const reloadFrom = toOptionalLevel(b.reloadFrom, 'reloadFrom')
  const reloadTo = toOptionalLevel(b.reloadTo, 'reloadTo')
  if ((reloadFrom === null) !== (reloadTo === null)) badRequest('Invalid reload')

  const weekNumber = Number(b.weekNumber)
  const year = Number(b.year)
  const week =
    Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 53 && Number.isInteger(year)
      ? { week: weekNumber, year }
      : getISOWeek(date)

  return {
    level: toLevel(b.level, 'level'),
    reloadFrom,
    reloadTo,
    date,
    weekNumber: week.week,
    year: week.year,
    notes: typeof b.notes === 'string' && b.notes.trim() ? b.notes : null,
  }
}
