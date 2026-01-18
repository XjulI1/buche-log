<script setup lang="ts">
import type { ConsumptionEntry } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import { formatWeek } from '@/services/calculations/week'

defineProps<{
  entries: ConsumptionEntry[]
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTypeLabel(type: 'reload' | 'consumption'): string {
  return type === 'reload' ? 'Rechargement' : 'Consommation'
}

function getTypeIcon(type: 'reload' | 'consumption'): string {
  return type === 'reload' ? '📦' : '🔥'
}
</script>

<template>
  <BaseCard title="Historique recent" padding="none">
    <div v-if="entries.length === 0" class="empty">Aucun enregistrement</div>

    <ul v-else class="entry-list">
      <li v-for="entry in entries.slice(0, 10)" :key="entry.id" class="entry-item">
        <div class="entry-icon">{{ getTypeIcon(entry.type) }}</div>
        <div class="entry-content">
          <div class="entry-header">
            <span class="entry-type">{{ getTypeLabel(entry.type) }}</span>
            <span class="entry-percentage">{{ entry.percentage }}%</span>
          </div>
          <div class="entry-meta">
            <span class="entry-date">{{ formatDate(entry.date) }}</span>
            <span class="entry-week">{{ formatWeek(entry.weekNumber, entry.year) }}</span>
          </div>
          <div v-if="entry.notes" class="entry-notes">{{ entry.notes }}</div>
        </div>
        <button class="delete-btn" @click="emit('delete', entry.id)" title="Supprimer">
          &#x2715;
        </button>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.entry-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.entry-item:last-child {
  border-bottom: none;
}

.entry-icon {
  font-size: 1.25rem;
  padding-top: 0.125rem;
}

.entry-content {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.entry-type {
  font-weight: 600;
  color: var(--color-text);
}

.entry-percentage {
  font-weight: 700;
  color: var(--color-primary);
}

.entry-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.entry-notes {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.875rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
  color: var(--color-danger);
}
</style>
