<script setup lang="ts">
import { formatSeason, getCurrentSeason } from '~/services/calculations'

const model = defineModel<number>({ required: true })
const currentSeason = getCurrentSeason()
</script>

<template>
  <div class="season-selector">
    <button type="button" class="nav" aria-label="Saison précédente" @click="model--">‹</button>
    <span class="label">
      <small>Saison</small>
      {{ formatSeason(model) }}
    </span>
    <button
      type="button"
      class="nav"
      aria-label="Saison suivante"
      :disabled="model >= currentSeason"
      @click="model++"
    >
      ›
    </button>
  </div>
</template>

<style scoped>
.season-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.nav {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 1.25rem;
  color: var(--color-text);
  cursor: pointer;
}

.nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.label {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 96px;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.1;
}

.label small {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
