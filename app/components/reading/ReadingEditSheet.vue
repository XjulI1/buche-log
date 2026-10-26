<script setup lang="ts">
import { storeToRefs } from 'pinia'
import BaseSheet from '~/components/common/BaseSheet.vue'
import ReadingForm from './ReadingForm.vue'
import type { ConsumptionEntry, ConsumptionFormData } from '#shared/types'
import { useConsumptionStore } from '~/stores/consumptionStore'
import { useToast } from '~/composables/useToast'
import { formatDayLabel } from '~/services/calculations'

const props = defineProps<{
  entry: ConsumptionEntry | null
}>()

const emit = defineEmits<{
  close: []
}>()

const consumptionStore = useConsumptionStore()
const { loading } = storeToRefs(consumptionStore)
const toast = useToast()

async function handleSubmit(data: ConsumptionFormData) {
  if (!props.entry) return
  try {
    await consumptionStore.updateEntry(props.entry.id, data)
    toast.show('Relevé modifié')
    emit('close')
  } catch (e) {
    toast.showError(e)
  }
}

async function handleDelete() {
  if (!props.entry) return
  if (!confirm(`Supprimer le relevé du ${formatDayLabel(props.entry.date)} ?`)) return
  try {
    await consumptionStore.deleteEntry(props.entry.id)
    toast.show('Relevé supprimé')
    emit('close')
  } catch (e) {
    toast.showError(e)
  }
}
</script>

<template>
  <BaseSheet :open="!!entry" title="Modifier le relevé" @close="emit('close')">
    <ReadingForm
      v-if="entry"
      :key="entry.id"
      :entry="entry"
      :loading="loading"
      :picker-height="180"
      @submit="handleSubmit"
      @delete="handleDelete"
      @cancel="emit('close')"
    />
  </BaseSheet>
</template>
