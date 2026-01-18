import { computed, ref } from 'vue'
import {
  getISOWeek,
  getWeekStartDate,
  getWeekEndDate,
  formatWeek,
  getCurrentWeek,
  getWeeksInYear,
} from '@/services/calculations/week'

export function useWeek() {
  const now = getCurrentWeek()
  const selectedYear = ref(now.year)
  const selectedWeek = ref(now.week)

  const weekLabel = computed(() => formatWeek(selectedWeek.value, selectedYear.value))

  const weekStartDate = computed(() => getWeekStartDate(selectedYear.value, selectedWeek.value))

  const weekEndDate = computed(() => getWeekEndDate(selectedYear.value, selectedWeek.value))

  const weeksInSelectedYear = computed(() => getWeeksInYear(selectedYear.value))

  const isCurrentWeek = computed(
    () => selectedWeek.value === now.week && selectedYear.value === now.year,
  )

  function setWeek(week: number, year: number) {
    selectedWeek.value = week
    selectedYear.value = year
  }

  function nextWeek() {
    if (selectedWeek.value >= weeksInSelectedYear.value) {
      selectedWeek.value = 1
      selectedYear.value++
    } else {
      selectedWeek.value++
    }
  }

  function previousWeek() {
    if (selectedWeek.value <= 1) {
      selectedYear.value--
      selectedWeek.value = getWeeksInYear(selectedYear.value)
    } else {
      selectedWeek.value--
    }
  }

  function goToCurrentWeek() {
    const current = getCurrentWeek()
    selectedWeek.value = current.week
    selectedYear.value = current.year
  }

  function getWeekFromDate(date: Date) {
    return getISOWeek(date)
  }

  return {
    selectedYear,
    selectedWeek,
    weekLabel,
    weekStartDate,
    weekEndDate,
    weeksInSelectedYear,
    isCurrentWeek,
    setWeek,
    nextWeek,
    previousWeek,
    goToCurrentWeek,
    getWeekFromDate,
    formatWeek,
  }
}
