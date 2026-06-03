/**
 * Retourne le numero de semaine ISO et l'annee pour une date donnee
 */
export function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

/**
 * Retourne la date de debut d'une semaine ISO
 */
export function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)

  const targetDate = new Date(firstMonday)
  targetDate.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)
  return targetDate
}

/**
 * Retourne la date de fin d'une semaine ISO
 */
export function getWeekEndDate(year: number, week: number): Date {
  const start = getWeekStartDate(year, week)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return end
}

/**
 * Retourne le nombre de semaines dans une annee ISO
 */
export function getWeeksInYear(year: number): number {
  const dec31 = new Date(Date.UTC(year, 11, 31))
  const { week } = getISOWeek(dec31)
  return week === 1 ? 52 : week
}

/**
 * Formate une semaine pour l'affichage (ex: "S03 2024")
 */
export function formatWeek(week: number, year: number): string {
  return `S${week.toString().padStart(2, '0')} ${year}`
}

/**
 * Retourne la semaine courante
 */
export function getCurrentWeek(): { week: number; year: number } {
  return getISOWeek(new Date())
}
