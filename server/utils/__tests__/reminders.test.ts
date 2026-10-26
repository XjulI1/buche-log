// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getLocalTime, shouldRemind } from '../reminders'

// Dimanche 25 octobre 2026, 18h05 a Paris (UTC+1 apres le changement d'heure)
const SUNDAY_18H_PARIS = new Date('2026-10-25T17:05:00Z')

const base = {
  now: SUNDAY_18H_PARIS,
  timeZone: 'Europe/Paris',
  remindDay: 0,
  remindHour: 18,
  lastNotifiedAt: null,
  lastReadingDate: null,
}

describe('getLocalTime', () => {
  it('converts to the subscriber time zone', () => {
    expect(getLocalTime(SUNDAY_18H_PARIS, 'Europe/Paris')).toMatchObject({ day: 0, hour: 18 })
    expect(getLocalTime(SUNDAY_18H_PARIS, 'America/New_York')).toMatchObject({ day: 0, hour: 13 })
  })
})

describe('shouldRemind', () => {
  it('reminds at the chosen day and hour when no reading exists', () => {
    expect(shouldRemind(base)).toBe(true)
  })

  it('does not remind at another hour or day', () => {
    expect(shouldRemind({ ...base, remindHour: 19 })).toBe(false)
    expect(shouldRemind({ ...base, remindDay: 1 })).toBe(false)
  })

  it('does not remind when a reading was made this ISO week', () => {
    expect(shouldRemind({ ...base, lastReadingDate: new Date(2026, 9, 19) })).toBe(false)
  })

  it('reminds when the last reading is from the previous week', () => {
    expect(shouldRemind({ ...base, lastReadingDate: new Date(2026, 9, 18) })).toBe(true)
  })

  it('does not notify twice within 20 hours', () => {
    const lastNotifiedAt = new Date(SUNDAY_18H_PARIS.getTime() - 3600 * 1000)
    expect(shouldRemind({ ...base, lastNotifiedAt })).toBe(false)
  })
})
