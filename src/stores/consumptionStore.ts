import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConsumptionEntry, ConsumptionFormData, WeeklyStats, YearlyStats } from '@/types'
import * as consumptionRepo from '@/services/database/consumptionRepository'
import {
  calculateCurrentLevel,
  calculateWeeklyStats,
  calculateYearlyStats,
  getCurrentWeek,
  calculateRemainingSteres,
} from '@/services/calculations'
import { useRackStore } from './rackStore'

export const useConsumptionStore = defineStore('consumption', () => {
  const entries = ref<ConsumptionEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const rackStore = useRackStore()

  const currentLevel = computed(() => calculateCurrentLevel(entries.value))

  const remainingSteres = computed(() => {
    if (!rackStore.rack) return 0
    return calculateRemainingSteres(rackStore.volumeSteres, currentLevel.value)
  })

  const lastEntry = computed(() => {
    if (entries.value.length === 0) return null
    return [...entries.value].sort((a, b) => b.date.getTime() - a.date.getTime())[0]
  })

  const currentWeekStats = computed((): WeeklyStats | null => {
    if (!rackStore.rack) return null
    const { week, year } = getCurrentWeek()
    return calculateWeeklyStats(entries.value, rackStore.rack, week, year)
  })

  async function loadEntries() {
    if (!rackStore.rack) return
    loading.value = true
    error.value = null
    try {
      entries.value = await consumptionRepo.getConsumptionsByRack(rackStore.rack.id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function addEntry(data: ConsumptionFormData) {
    if (!rackStore.rack) return
    loading.value = true
    error.value = null
    try {
      const entry = await consumptionRepo.createConsumption(rackStore.rack.id, data)
      entries.value = [entry, ...entries.value]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de l\'ajout'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id: string) {
    loading.value = true
    error.value = null
    try {
      await consumptionRepo.deleteConsumption(id)
      entries.value = entries.value.filter((e) => e.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la suppression'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function clearAll() {
    loading.value = true
    error.value = null
    try {
      await consumptionRepo.deleteAllConsumptions()
      entries.value = []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la suppression'
      throw e
    } finally {
      loading.value = false
    }
  }

  function getYearlyStats(year: number): YearlyStats | null {
    if (!rackStore.rack) return null
    return calculateYearlyStats(entries.value, rackStore.rack, year)
  }

  function getWeeklyStats(week: number, year: number): WeeklyStats | null {
    if (!rackStore.rack) return null
    return calculateWeeklyStats(entries.value, rackStore.rack, week, year)
  }

  return {
    entries,
    loading,
    error,
    currentLevel,
    remainingSteres,
    lastEntry,
    currentWeekStats,
    loadEntries,
    addEntry,
    deleteEntry,
    clearAll,
    getYearlyStats,
    getWeeklyStats,
  }
})
