<script setup lang="ts">
import type { YearlyStats } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  stats: YearlyStats
}>()
</script>

<template>
  <BaseCard title="Resume annuel">
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalConsumedSteres.toFixed(2) }}</span>
        <span class="stat-label">Steres consommes</span>
      </div>

      <div class="stat-item">
        <span class="stat-value">{{ stats.weeklyAverageSteres.toFixed(2) }}</span>
        <span class="stat-label">Moyenne / semaine</span>
      </div>

      <div class="stat-item">
        <span class="stat-value">{{ stats.totalReloads }}</span>
        <span class="stat-label">Rechargements</span>
      </div>

      <div class="stat-item">
        <span class="stat-value">S{{ stats.peakWeek }}</span>
        <span class="stat-label">Semaine pic</span>
      </div>
    </div>

    <div class="weekly-table">
      <h4 class="table-title">Detail par semaine</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Semaine</th>
            <th>Conso %</th>
            <th>Recharges</th>
            <th>Steres</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in stats.weeks.filter((w) => w.entries > 0)" :key="week.weekNumber">
            <td>S{{ week.weekNumber.toString().padStart(2, '0') }}</td>
            <td>{{ week.consumptionPercent }}%</td>
            <td>{{ week.reloadCount }}</td>
            <td class="highlight">{{ week.totalConsumedSteres.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseCard>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--color-primary-light);
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: center;
}

.weekly-table {
  margin-top: 1rem;
}

.table-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--color-text-secondary);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table th,
.table td {
  padding: 0.5rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.table td.highlight {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
