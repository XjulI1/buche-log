import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rack, RackFormData } from '@/types'
import * as rackRepo from '@/services/database/rackRepository'

export const useRackStore = defineStore('rack', () => {
  const rack = ref<Rack | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasRack = computed(() => rack.value !== null)
  const volumeSteres = computed(() => rack.value?.volumeSteres ?? 0)

  async function loadRack() {
    loading.value = true
    error.value = null
    try {
      rack.value = (await rackRepo.getDefaultRack()) ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createRack(data: RackFormData) {
    loading.value = true
    error.value = null
    try {
      rack.value = await rackRepo.createRack(data)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la creation'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateRack(data: RackFormData) {
    if (!rack.value) return
    loading.value = true
    error.value = null
    try {
      const updated = await rackRepo.updateRack(rack.value.id, data)
      if (updated) rack.value = updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la mise a jour'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteRack() {
    if (!rack.value) return
    loading.value = true
    error.value = null
    try {
      await rackRepo.deleteRack(rack.value.id)
      rack.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la suppression'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    rack,
    loading,
    error,
    hasRack,
    volumeSteres,
    loadRack,
    createRack,
    updateRack,
    deleteRack,
  }
})
