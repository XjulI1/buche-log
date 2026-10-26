<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '~/stores'
import BaseCard from '~/components/common/BaseCard.vue'
import SeasonSelector from '~/components/stats/SeasonSelector.vue'
import SeasonChart from '~/components/stats/SeasonChart.vue'
import {
  formatSeason,
  formatSteres,
  getCurrentSeason,
  getMonday,
} from '~/services/calculations'
import type { SeasonStats } from '#shared/types'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()

const { forecast } = storeToRefs(consumptionStore)

const season = ref(getCurrentSeason())
const isCurrentSeason = computed(() => season.value === getCurrentSeason())

const stats = computed(() => consumptionStore.getSeasonStats(season.value))
const previousStats = computed(() => consumptionStore.getSeasonStats(season.value - 1))
const hasPrevious = computed(() => (previousStats.value?.readingsCount ?? 0) > 0)

/** Index de la semaine en cours (saison courante) ou derniere semaine de la saison */
const elapsedWeeks = computed(() => {
  if (!stats.value) return 0
  if (!isCurrentSeason.value) return stats.value.weeks.length
  const monday = getMonday(new Date()).getTime()
  return stats.value.weeks.findIndex((w) => w.weekStart.getTime() === monday) + 1
})

/** Semaines affichees : jusqu'a aujourd'hui, ou jusqu'a la derniere donnee connue */
const weekCount = computed(() => {
  if (!stats.value) return 0
  const lastWithData = (s: SeasonStats | null) =>
    s ? s.weeks.findLastIndex((w) => w.entries > 0) + 1 : 0
  if (isCurrentSeason.value) return Math.max(elapsedWeeks.value, 1)
  return Math.max(lastWithData(stats.value), lastWithData(previousStats.value), 1)
})

/** Consommation de la saison precedente sur la meme periode */
const previousToDate = computed(() => {
  if (!previousStats.value || !hasPrevious.value) return null
  return previousStats.value.weeks
    .slice(0, elapsedWeeks.value)
    .reduce((sum, w) => sum + w.consumedSteres, 0)
})

const comparison = computed(() => {
  if (!stats.value || !previousToDate.value) return null
  return ((stats.value.totalConsumedSteres - previousToDate.value) / previousToDate.value) * 100
})

const tableWeeks = computed(() =>
  (stats.value?.weeks ?? []).filter((w) => w.entries > 0).slice().reverse(),
)

onMounted(async () => {
  await rackStore.loadRack()
  if (!rackStore.hasRack) {
    router.push({ name: 'rack' })
    return
  }
  await consumptionStore.loadEntries()
})

function formatWeekStart(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="page wide">
    <div class="toolbar">
      <SeasonSelector v-model="season" />
      <span class="period">Du 1er octobre au 30 septembre</span>
    </div>

    <div v-if="stats && stats.readingsCount > 0" class="stats-layout">
      <div class="tiles">
        <div class="tile">
          <span class="tile-value">{{ formatSteres(stats.totalConsumedSteres) }}</span>
          <span class="tile-label">consommés sur la saison</span>
          <span v-if="comparison !== null" class="tile-delta">
            {{ comparison > 0 ? '▲ +' : '▼ ' }}{{ Math.round(comparison) }} % vs
            {{ formatSeason(season - 1) }} à date
          </span>
        </div>
        <div class="tile">
          <span class="tile-value">{{ formatSteres(stats.weeklyAverageSteres) }}</span>
          <span class="tile-label">en moyenne par semaine</span>
        </div>
        <div class="tile">
          <span class="tile-value">
            {{ stats.peakWeek ? `S${stats.peakWeek.weekNumber}` : '—' }}
          </span>
          <span class="tile-label">
            semaine la plus froide
            <template v-if="stats.peakWeek">({{ formatSteres(stats.peakWeek.consumedSteres) }})</template>
          </span>
        </div>
        <div class="tile">
          <span class="tile-value">{{ stats.totalReloads }}</span>
          <span class="tile-label">rechargements</span>
        </div>
      </div>

      <BaseCard title="Consommation par semaine" class="chart-card">
        <SeasonChart
          :current="stats"
          :previous="hasPrevious ? previousStats : null"
          :week-count="weekCount"
        />
      </BaseCard>

      <BaseCard v-if="isCurrentSeason && forecast" title="Prévision" class="forecast-card">
        <ul class="forecast">
          <li>
            <span>Rythme actuel</span>
            <strong>{{ formatSteres(forecast.steresPerWeek) }} / sem.</strong>
          </li>
          <li v-if="forecast.daysUntilEmpty !== null">
            <span>Porte-bûches vide dans</span>
            <strong>≈ {{ Math.round(forecast.daysUntilEmpty) }} jours</strong>
          </li>
          <li v-if="forecast.remainingSeasonSteres !== null">
            <span>Encore nécessaire d'ici fin avril</span>
            <strong>≈ {{ formatSteres(forecast.remainingSeasonSteres) }}</strong>
          </li>
          <li v-if="forecast.remainingSeasonSteres !== null">
            <span>Total estimé de la saison</span>
            <strong>≈ {{ formatSteres(stats.totalConsumedSteres + forecast.remainingSeasonSteres) }}</strong>
          </li>
        </ul>
        <p class="forecast-basis">
          {{
            forecast.basis === 'previous-season'
              ? `Basé sur la saison ${formatSeason(season - 1)} à la même période.`
              : 'Basé sur le rythme des 4 dernières semaines.'
          }}
        </p>
      </BaseCard>

      <BaseCard title="Détail par semaine" padding="none" class="table-card">
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Semaine</th>
                <th scope="col">Consommé</th>
                <th scope="col">Stères</th>
                <th scope="col">Recharges</th>
                <th scope="col">Relevés</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="week in tableWeeks" :key="week.weekStart.getTime()">
                <td>
                  <strong>S{{ String(week.weekNumber).padStart(2, '0') }}</strong>
                  <small>{{ formatWeekStart(week.weekStart) }}</small>
                </td>
                <td>{{ week.consumedPercent }} %</td>
                <td class="highlight">{{ formatSteres(week.consumedSteres) }}</td>
                <td>{{ week.reloadCount || '—' }}</td>
                <td>{{ week.entries }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <div v-else class="empty">
      <p>Aucun relevé pour la saison {{ formatSeason(season) }}.</p>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.period {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.stats-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.tile-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.tile-delta {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
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

.table-card :deep(.card-title) {
  padding: 1.25rem 1.25rem 0;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table th,
.table td {
  padding: 0.625rem 1rem;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.table th:first-child,
.table td:first-child {
  text-align: left;
}

.table td small {
  margin-left: 0.5rem;
  color: var(--color-text-muted);
}

.table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table tr:last-child td {
  border-bottom: none;
}

.table td.highlight {
  font-weight: 700;
  color: var(--color-primary);
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

@media (min-width: 900px) {
  .stats-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      'tiles tiles'
      'chart forecast'
      'table table';
    gap: 1.5rem;
    align-items: start;
  }

  .tiles {
    grid-area: tiles;
    grid-template-columns: repeat(4, 1fr);
  }

  .chart-card {
    grid-area: chart;
  }

  .forecast-card {
    grid-area: forecast;
  }

  .table-card {
    grid-area: table;
  }

  .stats-layout:not(:has(.forecast-card)) .chart-card {
    grid-column: 1 / -1;
  }
}
</style>
