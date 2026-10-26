<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '~/stores'
import BaseCard from '~/components/common/BaseCard.vue'
import SeasonSelector from '~/components/stats/SeasonSelector.vue'
import ReadingList from '~/components/reading/ReadingList.vue'
import ReadingEditSheet from '~/components/reading/ReadingEditSheet.vue'
import { getCurrentSeason, isInSeason } from '~/services/calculations'
import type { ConsumptionEntry } from '#shared/types'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()

const { volumeSteres } = storeToRefs(rackStore)
const { sortedEntries, consumptions } = storeToRefs(consumptionStore)

const season = ref(getCurrentSeason())
const editedEntry = ref<ConsumptionEntry | null>(null)

const seasonEntries = computed(() =>
  sortedEntries.value.filter((e) => isInSeason(e.date, season.value)),
)

onMounted(async () => {
  await rackStore.loadRack()
  if (!rackStore.hasRack) {
    router.push({ name: 'rack' })
    return
  }
  await consumptionStore.loadEntries()
})
</script>

<template>
  <div class="page wide">
    <div class="toolbar">
      <SeasonSelector v-model="season" />
      <span class="count">{{ seasonEntries.length }} relevé(s)</span>
    </div>

    <BaseCard padding="none">
      <ReadingList
        :entries="seasonEntries"
        :consumptions="consumptions"
        :volume-steres="volumeSteres"
        @select="editedEntry = $event"
      />
    </BaseCard>

    <p class="hint">Touchez un relevé pour modifier sa date, son niveau ou sa note.</p>

    <ReadingEditSheet :entry="editedEntry" @close="editedEntry = null" />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.hint {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
