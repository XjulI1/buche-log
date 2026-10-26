/**
 * Conversion Date <-> valeur d'un <input type="date"> (YYYY-MM-DD, heure locale)
 */
export function toInputDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Date d'un releve a partir du champ date : maintenant si c'est aujourd'hui,
 * sinon midi (heure locale) pour eviter tout decalage de fuseau.
 */
export function fromInputDate(value: string, now: Date = new Date()): Date {
  if (value === toInputDate(now)) return now
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 12)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatSteres(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} st`
}
