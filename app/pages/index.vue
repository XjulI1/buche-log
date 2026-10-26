<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '~/stores'
import RackVisual from '~/components/rack/RackVisual.vue'
import BaseButton from '~/components/common/BaseButton.vue'
import BaseCard from '~/components/common/BaseCard.vue'
import ReadingForm from '~/components/reading/ReadingForm.vue'
import ReadingList from '~/components/reading/ReadingList.vue'
import ReadingEditSheet from '~/components/reading/ReadingEditSheet.vue'
import { useBreakpoint } from '~/composables/useBreakpoint'
import { useToast } from '~/composables/useToast'
import { formatDayLabel, formatSteres, getCurrentWeek } from '~/services/calculations'
import type { ConsumptionEntry, ConsumptionFormData } from '#shared/types'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()
const { isDesktop } = useBreakpoint()
const toast = useToast()

const { rack, hasRack, loading: rackLoading } = storeToRefs(rackStore)
const {
  currentLevel,
  remainingSteres,
  lastEntry,
  sortedEntries,
  consumptions,
  hasReadingThisWeek,
  currentWeekStats,
  forecast,
  loading,
} = storeToRefs(consumptionStore)

const currentWeek = getCurrentWeek().week
const editedEntry = ref<ConsumptionEntry | null>(null)
const formKey = ref(0)

onMounted(async () => {
  await rackStore.loadRack()
  if (rackStore.hasRack) {
    await consumptionStore.loadEntries()
  }
})

async function handleSubmit(data: ConsumptionFormData) {
  try {
    await consumptionStore.addEntry(data)
    toast.show('Relevé enregistré')
    formKey.value++
  } catch {
    // Erreur geree dans le store
  }
}

function formatEmptyDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="page wide">
    <div v-if="rackLoading" class="loading">Chargement...</div>

    <template v-else-if="hasRack && rack">
      <div v-if="!hasReadingThisWeek" class="banner" role="status">
        <span>📅 Pas encore de relevé cette semaine (S{{ currentWeek }}).</span>
        <BaseButton v-if="!isDesktop" size="small" @click="router.push('/releve')">
          Faire le relevé
        </BaseButton>
      </div>

      <div class="dashboard">
        <section class="status">
          <BaseCard>
            <div class="status-main">
              <RackVisual :level="currentLevel" :height="isDesktop ? 200 : 160" />
              <div class="figures">
                <div class="figure">
                  <span class="figure-value">{{ formatSteres(remainingSteres) }}</span>
                  <span class="figure-label">restants sur {{ formatSteres(rack.volumeSteres) }}</span>
                </div>
                <div class="figure">
                  <span class="figure-value small">
                    {{ lastEntry ? formatDayLabel(lastEntry.date) : '—' }}
                  </span>
                  <span class="figure-label">dernier relevé</span>
                </div>
                <div v-if="currentWeekStats" class="figure">
                  <span class="figure-value small">
                    {{ formatSteres(currentWeekStats.consumedSteres) }}
                  </span>
                  <span class="figure-label">consommés cette semaine</span>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard v-if="forecast" title="Prévision">
            <ul class="forecast">
              <li>
                <span>Rythme (4 dernières semaines)</span>
                <strong>{{ formatSteres(forecast.steresPerWeek) }} / sem.</strong>
              </li>
              <li v-if="forecast.emptyDate">
                <span>Porte-bûches vide vers le</span>
                <strong>{{ formatEmptyDate(forecast.emptyDate) }}</strong>
              </li>
              <li v-if="forecast.remainingSeasonSteres !== null">
                <span>Encore nécessaire d'ici fin avril</span>
                <strong>≈ {{ formatSteres(forecast.remainingSeasonSteres) }}</strong>
              </li>
            </ul>
            <p class="forecast-basis">
              {{
                forecast.basis === 'previous-season'
                  ? 'Estimation basée sur la saison précédente à la même période.'
                  : 'Estimation basée sur le rythme actuel.'
              }}
            </p>
          </BaseCard>

          <BaseButton v-if="!isDesktop" size="large" class="cta" @click="router.push('/releve')">
            ➕ Faire le relevé
          </BaseButton>
        </section>

        <BaseCard v-if="isDesktop" title="Relevé de la semaine" class="entry">
          <ReadingForm :key="formKey" :loading="loading" @submit="handleSubmit" />
        </BaseCard>

        <BaseCard title="Derniers relevés" padding="none" class="history">
          <ReadingList
            :entries="sortedEntries.slice(0, isDesktop ? 8 : 4)"
            :consumptions="consumptions"
            :volume-steres="rack.volumeSteres"
            class="compact"
            @select="editedEntry = $event"
          />
          <NuxtLink v-if="sortedEntries.length > 0" to="/historique" class="see-all">
            Tout l'historique →
          </NuxtLink>
        </BaseCard>
      </div>

      <ReadingEditSheet :entry="editedEntry" @close="editedEntry = null" />
    </template>

    <template v-else>
      <div class="welcome">
        <div class="welcome-icon">🪵</div>
        <h2>Bienvenue sur Buche-Log</h2>
        <p>Suivez votre consommation de bois de chauffage semaine par semaine.</p>
        <p>Commencez par configurer votre porte-bûches.</p>
        <BaseButton size="large" @click="router.push({ name: 'rack' })">
          Configurer mon porte-bûches
        </BaseButton>
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

.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  color: #8a4a00;
  font-weight: 600;
  font-size: 0.9375rem;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-main {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
}

.figures {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.figure {
  display: flex;
  flex-direction: column;
}

.figure-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.figure-value.small {
  font-size: 1.0625rem;
  color: var(--color-text);
}

.figure-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.forecast {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.forecast li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9375rem;
}

.forecast span {
  color: var(--color-text-secondary);
}

.forecast-basis {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.cta {
  width: 100%;
}

.see-all {
  display: block;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.875rem;
}

.history :deep(.card-title) {
  padding: 1.25rem 1.25rem 0;
}

/* La liste compacte garde la disposition mobile meme sur desktop */
.compact :deep(.head) {
  display: none;
}

.compact :deep(.row) {
  grid-template-columns: 1fr auto auto;
  grid-template-areas:
    'date level edit'
    'consumed reload edit'
    'notes notes edit';
  gap: 0.25rem 0.75rem;
}

.compact :deep(.level),
.compact :deep(.reload) {
  justify-self: end;
}

.compact :deep(.notes:empty) {
  display: none;
}

@media (min-width: 900px) {
  .dashboard {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(420px, 1.4fr);
    grid-template-areas:
      'status entry'
      'history entry';
    align-items: start;
    gap: 1.5rem;
  }

  .status {
    grid-area: status;
  }

  .entry {
    grid-area: entry;
  }

  .history {
    grid-area: history;
  }
}

@media (min-width: 1280px) {
  .dashboard {
    grid-template-columns: minmax(280px, 1fr) minmax(440px, 1.4fr) minmax(300px, 1fr);
    grid-template-areas: 'status entry history';
  }
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
