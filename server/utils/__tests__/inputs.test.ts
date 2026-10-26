// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseRackInput, parseReadingInput } from '../inputs'

describe('parseRackInput', () => {
  it('computes volumes from dimensions', () => {
    const rack = parseRackInput({ name: ' Abri ', height: 100, width: 100, depth: 70, logSize: 33 })

    expect(rack).toMatchObject({ name: 'Abri', logSize: '33', volumeM3: '0.7' })
    expect(Number(rack.volumeSteres)).toBeCloseTo(1)
  })

  it('ignores volumes sent by the client', () => {
    const rack = parseRackInput({
      name: 'Abri',
      height: 100,
      width: 100,
      depth: 100,
      logSize: 50,
      volumeSteres: 999,
    })
    expect(Number(rack.volumeSteres)).toBeCloseTo(1.25)
  })

  it('rejects invalid values', () => {
    const valid = { name: 'Abri', height: 100, width: 100, depth: 100, logSize: 50 }
    expect(() => parseRackInput({ ...valid, name: '' })).toThrow('Invalid name')
    expect(() => parseRackInput({ ...valid, height: -1 })).toThrow('Invalid height')
    expect(() => parseRackInput({ ...valid, logSize: 40 })).toThrow('Invalid logSize')
    expect(() => parseRackInput(undefined)).toThrow()
  })
})

describe('parseReadingInput', () => {
  const valid = { level: 60, date: '2024-01-15T12:00:00.000Z', weekNumber: 3, year: 2024 }

  it('keeps the ISO week computed by the client', () => {
    expect(parseReadingInput({ ...valid, weekNumber: 2 })).toMatchObject({ weekNumber: 2, year: 2024 })
  })

  it('derives the ISO week from the date when missing', () => {
    expect(parseReadingInput({ level: 60, date: '2024-01-15T12:00:00.000Z' })).toMatchObject({
      weekNumber: 3,
      year: 2024,
    })
  })

  it('normalizes optional fields', () => {
    expect(parseReadingInput({ ...valid, notes: '  ' })).toMatchObject({
      reloadFrom: null,
      reloadTo: null,
      notes: null,
    })
    expect(parseReadingInput({ ...valid, reloadFrom: 10, reloadTo: 100 })).toMatchObject({
      reloadFrom: 10,
      reloadTo: 100,
    })
  })

  it('rejects invalid values', () => {
    expect(() => parseReadingInput({ ...valid, level: 101 })).toThrow('Invalid level')
    expect(() => parseReadingInput({ ...valid, level: 'abc' })).toThrow('Invalid level')
    expect(() => parseReadingInput({ ...valid, date: 'nope' })).toThrow('Invalid date')
    expect(() => parseReadingInput({ ...valid, reloadFrom: 10 })).toThrow('Invalid reload')
  })
})
