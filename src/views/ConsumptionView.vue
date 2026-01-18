<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '@/stores'
import ConsumptionForm from '@/components/consumption/ConsumptionForm.vue'
import ConsumptionList from '@/components/consumption/ConsumptionList.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { ConsumptionFormData, ConsumptionType } from '@/types'

const route = useRoute()
const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()

const { hasRack } = storeToRefs(rackStore)
const { entries, currentLevel, loading } = storeToRefs(consumptionStore)

const activeType = ref<ConsumptionType>((route.query.type as ConsumptionType) || 'consumption')

const tabs = [
  { type: 'consumption' as const, label: 'Consommation' },
  { type: 'reload' as const, label: 'Rechargement' },
]

watch(
  () => route.query.type,
  (newType) => {
    if (newType === 'reload' || newType === 'consumption') {
      activeType.value = newType
    }
  },
)

onMounted(async () => {
  await rackStore.loadRack()
  if (!hasRack.value) {
    router.push({ name: 'rack' })
    return
  }
  await consumptionStore.loadEntries()
})

function setActiveType(type: ConsumptionType) {
  activeType.value = type
  router.replace({ query: { type } })
}

async function handleSubmit(data: ConsumptionFormData) {
  try {
    await consumptionStore.addEntry(data)
  } catch {
    // Error handled in store
  }
}

async function handleDelete(id: string) {
  if (confirm('Supprimer cet enregistrement ?')) {
    await consumptionStore.deleteEntry(id)
  }
}
</script>

<template>
  <div class="page">
    <div class="tabs">
      <BaseButton
        v-for="tab in tabs"
        :key="tab.type"
        :variant="activeType === tab.type ? 'primary' : 'secondary'"
        size="small"
        @click="setActiveType(tab.type)"
      >
        {{ tab.label }}
      </BaseButton>
    </div>

    <div class="content">
      <ConsumptionForm
        :type="activeType"
        :loading="loading"
        :current-level="currentLevel"
        @submit="handleSubmit"
      />

      <ConsumptionList :entries="entries" @delete="handleDelete" />
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
