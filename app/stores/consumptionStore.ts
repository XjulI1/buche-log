import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ConsumptionEntry,
  ConsumptionFormData,
  Forecast,
  SeasonStats,
  WeeklyStats,
} from '#shared/types'
import * as consumptionRepo from '~/services/database/consumptionRepository'
import {
  calculateConsumptions,
  calculateCurrentLevel,
  calculateForecast,
  calculateRemainingSteres,
  calculateSeasonStats,
  calculateWeeklyStats,
  getCurrentWeek,
  getMonday,
  getPreviousEntry,
  sortEntries,
} from '~/services/calculations'
import { useRackStore } from './rackStore'

export const useConsumptionStore = defineStore('consumption', () => {
  const entries = ref<ConsumptionEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const rackStore = useRackStore()

  /** Releves du plus recent au plus ancien */
  const sortedEntries = computed(() => sortEntries(entries.value).reverse())

  /** Consommation (%) de chaque releve depuis le releve precedent */
  const consumptions = computed(() => calculateConsumptions(entries.value))

  const currentLevel = computed(() => calculateCurrentLevel(entries.value))

  const remainingSteres = computed(() => {
    if (!rackStore.rack) return 0
    return calculateRemainingSteres(rackStore.volumeSteres, currentLevel.value)
  })

  const lastEntry = computed(() => sortedEntries.value[0] ?? null)

  const hasReadingThisWeek = computed(() => {
    const { week, year } = getCurrentWeek()
    return entries.value.some((e) => e.weekNumber === week && e.year === year)
  })

  const currentWeekStats = computed((): WeeklyStats | null => {
    if (!rackStore.rack) return null
    return calculateWeeklyStats(
      entries.value,
      rackStore.rack,
      getMonday(new Date()),
      consumptions.value,
    )
  })

  const forecast = computed((): Forecast | null => {
    if (!rackStore.rack) return null
    return calculateForecast(entries.value, rackStore.rack)
  })

  function previousEntryFor(date: Date, excludeId?: string): ConsumptionEntry | null {
    return getPreviousEntry(entries.value, date, excludeId)
  }

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

  async function updateEntry(id: string, data: ConsumptionFormData) {
    loading.value = true
    error.value = null
    try {
      const updated = await consumptionRepo.updateConsumption(id, data)
      if (updated) {
        entries.value = entries.value.map((e) => (e.id === id ? updated : e))
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la modification'
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

  function getSeasonStats(season: number): SeasonStats | null {
    if (!rackStore.rack) return null
    return calculateSeasonStats(entries.value, rackStore.rack, season)
  }

  return {
    entries,
    loading,
    error,
    sortedEntries,
    consumptions,
    currentLevel,
    remainingSteres,
    lastEntry,
    hasReadingThisWeek,
    currentWeekStats,
    forecast,
    previousEntryFor,
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAll,
    getSeasonStats,
  }
})
