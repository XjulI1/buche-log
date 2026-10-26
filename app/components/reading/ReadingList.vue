<script setup lang="ts">
import type { ConsumptionEntry } from '#shared/types'
import { levelColor } from '~/components/rack/levelColor'
import {
  calculateConsumptionSteres,
  formatDayLabel,
  formatSteres,
  hasReload,
} from '~/services/calculations'

defineProps<{
  /** Releves du plus recent au plus ancien */
  entries: ConsumptionEntry[]
  consumptions: Map<string, number>
  volumeSteres: number
}>()

const emit = defineEmits<{
  select: [entry: ConsumptionEntry]
}>()
</script>

<template>
  <div class="reading-list">
    <div v-if="entries.length === 0" class="empty">Aucun relevé pour le moment.</div>

    <template v-else>
      <div class="head" aria-hidden="true">
        <span>Date</span>
        <span>Niveau</span>
        <span>Consommé</span>
        <span>Recharge</span>
        <span>Note</span>
      </div>
      <ul class="rows">
        <li v-for="entry in entries" :key="entry.id">
          <button type="button" class="row" @click="emit('select', entry)">
            <span class="date">
              <strong>{{ formatDayLabel(entry.date) }}</strong>
              <span class="week">S{{ String(entry.weekNumber).padStart(2, '0') }}</span>
            </span>
            <span class="level">
              <span class="dot" :style="{ background: levelColor(entry.level) }" />
              {{ entry.level }} %
            </span>
            <span class="consumed">
              <template v-if="(consumptions.get(entry.id) ?? 0) > 0">
                −{{ consumptions.get(entry.id) }} %
                <small>{{ formatSteres(calculateConsumptionSteres(volumeSteres, consumptions.get(entry.id) ?? 0)) }}</small>
              </template>
              <span v-else class="muted">—</span>
            </span>
            <span class="reload">
              <span v-if="hasReload(entry)" class="badge">
                Rechargé {{ entry.reloadFrom }} → {{ entry.reloadTo }} %
              </span>
            </span>
            <span class="notes">{{ entry.notes }}</span>
            <span class="edit" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.head {
  display: none;
}

.row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-areas:
    'date level edit'
    'consumed reload edit'
    'notes notes edit';
  align-items: center;
  gap: 0.25rem 0.75rem;
  padding: 0.875rem 1.25rem;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

li:last-child .row {
  border-bottom: none;
}

.row:hover {
  background: var(--color-surface-hover);
}

.date {
  grid-area: date;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.week {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.level {
  grid-area: level;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1.125rem;
  font-weight: 700;
  justify-self: end;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.consumed {
  grid-area: consumed;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.consumed small {
  margin-left: 0.25rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.muted {
  color: var(--color-text-muted);
}

.reload {
  grid-area: reload;
  justify-self: end;
}

.badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.notes {
  grid-area: notes;
  font-size: 0.8125rem;
  font-style: italic;
  color: var(--color-text-secondary);
}

.notes:empty {
  display: none;
}

.edit {
  grid-area: edit;
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

@media (min-width: 900px) {
  .head,
  .row {
    display: grid;
    grid-template-columns: 11rem 6rem 9rem 12rem 1fr 1.5rem;
    grid-template-areas: 'date level consumed reload notes edit';
    gap: 1rem;
  }

  .head {
    padding: 0.625rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }

  .level,
  .reload {
    justify-self: start;
  }

  .notes {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .notes:empty {
    display: block;
  }
}
</style>
