// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { prepareImport } from '../importData'

const NOW = new Date('2026-10-26T10:00:00Z')

function sequentialIds() {
  let i = 0
  return () => `id-${++i}`
}

const rack = {
  id: 'old-rack',
  name: 'Abri',
  height: 100,
  width: 100,
  depth: 100,
  logSize: 50,
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('prepareImport', () => {
  it('regenerates ids and links readings to the new rack', () => {
    const { racks, consumptions } = prepareImport(
      {
        version: 2,
        racks: [rack],
        consumptions: [
          { id: 'old-entry', rackId: 'old-rack', level: 80, date: '2024-01-15', weekNumber: 3, year: 2024 },
          { id: 'orphan', rackId: 'unknown', level: 50, date: '2024-01-16' },
        ],
      },
      'user-1',
      NOW,
      sequentialIds(),
    )

    expect(racks).toHaveLength(1)
    expect(racks[0]).toMatchObject({ id: 'id-1', userId: 'user-1', volumeSteres: '1.25' })
    expect(racks[0]!.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))

    expect(consumptions).toHaveLength(1)
    expect(consumptions[0]).toMatchObject({ id: 'id-2', rackId: 'id-1', userId: 'user-1', level: 80 })
    expect(consumptions[0]!.createdAt).toEqual(NOW)
  })

  it('converts v1 delta entries into level readings', () => {
    const { consumptions } = prepareImport(
      {
        version: 1,
        racks: [rack],
        consumptions: [
          { id: 'r', rackId: 'old-rack', type: 'reload', percentage: 100, date: '2024-01-01', createdAt: '2024-01-01' },
          { id: 'c', rackId: 'old-rack', type: 'consumption', percentage: 30, date: '2024-01-08', createdAt: '2024-01-08' },
        ],
      },
      'user-1',
      NOW,
      sequentialIds(),
    )

    expect(consumptions[0]).toMatchObject({ level: 100, reloadFrom: 0, reloadTo: 100, type: null })
    expect(consumptions[1]).toMatchObject({ level: 70, reloadFrom: null, reloadTo: null })
  })

  it('rejects an invalid file', () => {
    expect(() => prepareImport({}, 'user-1', NOW, sequentialIds())).toThrow('Invalid export format')
    expect(() => prepareImport({ version: 2, racks: [] }, 'user-1', NOW, sequentialIds())).toThrow()
  })
})
