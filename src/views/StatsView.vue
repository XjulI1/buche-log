<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '@/stores'
import ConsumptionChart from '@/components/stats/ConsumptionChart.vue'
import StatsTable from '@/components/stats/StatsTable.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()

const { hasRack } = storeToRefs(rackStore)

const selectedYear = ref(new Date().getFullYear())

const yearlyStats = computed(() => consumptionStore.getYearlyStats(selectedYear.value))

onMounted(async () => {
  await rackStore.loadRack()
  if (!hasRack.value) {
    router.push({ name: 'rack' })
    return
  }
  await consumptionStore.loadEntries()
})

function changeYear(delta: number) {
  selectedYear.value += delta
}
</script>

<template>
  <div class="page">
    <div class="year-selector">
      <BaseButton variant="secondary" size="small" @click="changeYear(-1)"> &lt; </BaseButton>
      <span class="year-label">{{ selectedYear }}</span>
      <BaseButton variant="secondary" size="small" @click="changeYear(1)"> &gt; </BaseButton>
    </div>

    <div v-if="yearlyStats" class="stats-content">
      <ConsumptionChart :stats="yearlyStats" />
      <StatsTable :stats="yearlyStats" />
    </div>

    <div v-else class="empty">
      <p>Aucune donnee pour cette annee.</p>
      <p>Commencez a enregistrer votre consommation.</p>
    </div>
  </div>
</template>

<style scoped>
.year-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.year-label {
  font-size: 1.25rem;
  font-weight: 700;
  min-width: 80px;
  text-align: center;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.empty p {
  margin: 0.5rem 0;
}
</style>
