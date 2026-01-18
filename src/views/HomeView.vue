<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '@/stores'
import RackVisual from '@/components/rack/RackVisual.vue'
import RackInfo from '@/components/rack/RackInfo.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()

const { rack, hasRack, loading: rackLoading } = storeToRefs(rackStore)
const { currentLevel, remainingSteres, currentWeekStats } = storeToRefs(consumptionStore)

onMounted(async () => {
  await rackStore.loadRack()
  if (rackStore.hasRack) {
    await consumptionStore.loadEntries()
  }
})

function goToConsumption() {
  router.push({ name: 'consumption', query: { type: 'consumption' } })
}

function goToReload() {
  router.push({ name: 'consumption', query: { type: 'reload' } })
}

function goToRackConfig() {
  router.push({ name: 'rack' })
}
</script>

<template>
  <div class="page">
    <div v-if="rackLoading" class="loading">Chargement...</div>

    <template v-else-if="hasRack && rack">
      <div class="dashboard">
        <div class="visual-section">
          <RackVisual :level="currentLevel" :height="180" />
        </div>

        <div class="actions">
          <BaseButton variant="primary" size="large" @click="goToConsumption">
            Consommation
          </BaseButton>
          <BaseButton variant="secondary" size="large" @click="goToReload">
            Rechargement
          </BaseButton>
        </div>

        <RackInfo :rack="rack" :current-level="currentLevel" :remaining-steres="remainingSteres" />

        <BaseCard v-if="currentWeekStats" title="Cette semaine">
          <div class="week-stats">
            <div class="stat">
              <span class="stat-value">{{ currentWeekStats.totalConsumedSteres.toFixed(2) }}</span>
              <span class="stat-label">steres consommes</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ currentWeekStats.reloadCount }}</span>
              <span class="stat-label">rechargements</span>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>

    <template v-else>
      <div class="welcome">
        <div class="welcome-icon">🪵</div>
        <h2>Bienvenue sur Buche-Log</h2>
        <p>Suivez votre consommation de bois de chauffage semaine par semaine.</p>
        <p>Commencez par configurer votre porte-buches.</p>
        <BaseButton size="large" @click="goToRackConfig"> Configurer mon porte-buches </BaseButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--color-text-muted);
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.visual-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.week-stats {
  display: flex;
  justify-content: space-around;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.welcome-icon {
  font-size: 4rem;
}

.welcome h2 {
  margin: 0;
}

.welcome p {
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
