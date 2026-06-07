import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWeek } from '../useWeek'

describe('useWeek', () => {
  beforeEach(() => {
    // Mock current date to January 15, 2024 (week 3)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 0, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with current week', () => {
    const { selectedWeek, selectedYear } = useWeek()

    expect(selectedWeek.value).toBe(3)
    expect(selectedYear.value).toBe(2024)
  })

  it('should format week label correctly', () => {
    const { weekLabel, setWeek } = useWeek()

    setWeek(1, 2024)
    expect(weekLabel.value).toBe('S01 2024')

    setWeek(52, 2024)
    expect(weekLabel.value).toBe('S52 2024')
  })

  it('should detect current week correctly', () => {
    const { isCurrentWeek, setWeek } = useWeek()

    expect(isCurrentWeek.value).toBe(true)

    setWeek(1, 2024)
    expect(isCurrentWeek.value).toBe(false)

    setWeek(3, 2024)
    expect(isCurrentWeek.value).toBe(true)
  })

  it('should navigate to next week', () => {
    const { selectedWeek, selectedYear, nextWeek, setWeek } = useWeek()

    setWeek(10, 2024)
    nextWeek()
    expect(selectedWeek.value).toBe(11)
    expect(selectedYear.value).toBe(2024)
  })

  it('should wrap to next year when advancing past last week', () => {
    const { selectedWeek, selectedYear, nextWeek, setWeek } = useWeek()

    setWeek(52, 2024)
    nextWeek()
    expect(selectedWeek.value).toBe(1)
    expect(selectedYear.value).toBe(2025)
  })

  it('should navigate to previous week', () => {
    const { selectedWeek, selectedYear, previousWeek, setWeek } = useWeek()

    setWeek(10, 2024)
    previousWeek()
    expect(selectedWeek.value).toBe(9)
    expect(selectedYear.value).toBe(2024)
  })

  it('should wrap to previous year when going before week 1', () => {
    const { selectedWeek, selectedYear, previousWeek, setWeek } = useWeek()

    setWeek(1, 2024)
    previousWeek()
    expect(selectedYear.value).toBe(2023)
    expect(selectedWeek.value).toBe(52)
  })

  it('should go to current week', () => {
    const { selectedWeek, selectedYear, goToCurrentWeek, setWeek } = useWeek()

    setWeek(1, 2020)
    expect(selectedWeek.value).toBe(1)
    expect(selectedYear.value).toBe(2020)

    goToCurrentWeek()
    expect(selectedWeek.value).toBe(3)
    expect(selectedYear.value).toBe(2024)
  })

  it('should get week from date', () => {
    const { getWeekFromDate } = useWeek()

    const result = getWeekFromDate(new Date(2024, 5, 15))
    expect(result).toEqual({ week: 24, year: 2024 })
  })

  it('should calculate week start date', () => {
    const { weekStartDate, setWeek } = useWeek()

    setWeek(1, 2024)
    expect(weekStartDate.value.getUTCFullYear()).toBe(2024)
    expect(weekStartDate.value.getUTCMonth()).toBe(0) // January
    expect(weekStartDate.value.getUTCDate()).toBe(1)
  })

  it('should calculate week end date', () => {
    const { weekEndDate, setWeek } = useWeek()

    setWeek(1, 2024)
    expect(weekEndDate.value.getUTCFullYear()).toBe(2024)
    expect(weekEndDate.value.getUTCMonth()).toBe(0) // January
    expect(weekEndDate.value.getUTCDate()).toBe(7)
  })

  it('should calculate weeks in selected year', () => {
    const { weeksInSelectedYear, setWeek } = useWeek()

    setWeek(1, 2024)
    expect(weeksInSelectedYear.value).toBe(52)

    setWeek(1, 2020) // 2020 has 53 weeks
    expect(weeksInSelectedYear.value).toBe(53)
  })

  it('should expose formatWeek function', () => {
    const { formatWeek } = useWeek()

    expect(formatWeek(5, 2024)).toBe('S05 2024')
  })
})
