<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore } from '~/stores/rackStore'
import { useConsumptionStore } from '~/stores/consumptionStore'
import BaseCard from '~/components/common/BaseCard.vue'
import ReadingForm from '~/components/reading/ReadingForm.vue'
import { useToast } from '~/composables/useToast'
import type { ConsumptionFormData } from '#shared/types'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()
const toast = useToast()

const { loading } = storeToRefs(consumptionStore)
const ready = ref(false)

onMounted(async () => {
  await rackStore.loadRack()
  if (!rackStore.hasRack) {
    router.push({ name: 'rack' })
    return
  }
  await consumptionStore.loadEntries()
  // Le formulaire s'initialise avec le releve precedent : on attend le chargement
  ready.value = true
})

async function handleSubmit(data: ConsumptionFormData) {
  try {
    await consumptionStore.addEntry(data)
    toast.show('Relevé enregistré')
    router.push('/')
  } catch (e) {
    toast.showError(e)
  }
}
</script>

<template>
  <div class="page">
    <BaseCard>
      <ReadingForm v-if="ready" :loading="loading" @submit="handleSubmit" />
      <div v-else class="loading">Chargement...</div>
    </BaseCard>
  </div>
</template>

<style scoped>
.loading {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
