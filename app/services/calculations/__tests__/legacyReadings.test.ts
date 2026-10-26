import { describe, it, expect } from 'vitest'
import { convertLegacyEntries, type LegacyEntry } from '#shared/utils/legacyReadings'

function legacy(
  id: string,
  type: LegacyEntry['type'],
  percentage: number,
  day: number,
  rackId = 'rack-1',
): LegacyEntry {
  return { id, rackId, type, percentage, date: new Date(2024, 0, day), createdAt: new Date(2024, 0, day) }
}

describe('convertLegacyEntries', () => {
  it('replays reloads (additive, capped) and consumptions in chronological order', () => {
    const result = convertLegacyEntries([
      legacy('c2', 'consumption', 20, 20),
      legacy('r1', 'reload', 100, 1),
      legacy('c1', 'consumption', 30, 10),
      legacy('r2', 'reload', 40, 25),
    ])

    expect(result.get('r1')).toEqual({ level: 100, reloadFrom: 0, reloadTo: 100 })
    expect(result.get('c1')).toEqual({ level: 70, reloadFrom: null, reloadTo: null })
    expect(result.get('c2')).toEqual({ level: 50, reloadFrom: null, reloadTo: null })
    expect(result.get('r2')).toEqual({ level: 90, reloadFrom: 50, reloadTo: 90 })
  })

  it('never goes below 0', () => {
    const result = convertLegacyEntries([
      legacy('r1', 'reload', 30, 1),
      legacy('c1', 'consumption', 50, 2),
    ])
    expect(result.get('c1')?.level).toBe(0)
  })

  it('handles each rack independently', () => {
    const result = convertLegacyEntries([
      legacy('a', 'reload', 60, 1, 'rack-a'),
      legacy('b', 'reload', 30, 2, 'rack-b'),
    ])
    expect(result.get('a')?.level).toBe(60)
    expect(result.get('b')?.reloadFrom).toBe(0)
  })
})
