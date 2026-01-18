<script setup lang="ts">
import type { Rack } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  rack: Rack
  currentLevel: number
  remainingSteres: number
}>()
</script>

<template>
  <BaseCard>
    <div class="rack-info">
      <div class="info-item">
        <span class="info-label">Nom</span>
        <span class="info-value">{{ rack.name }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Dimensions</span>
        <span class="info-value">{{ rack.height }} x {{ rack.width }} x {{ rack.depth }} cm</span>
      </div>
      <div class="info-item">
        <span class="info-label">Taille buches</span>
        <span class="info-value">{{ rack.logSize }} cm</span>
      </div>
      <div class="info-item">
        <span class="info-label">Capacite</span>
        <span class="info-value highlight">{{ rack.volumeSteres.toFixed(2) }} steres</span>
      </div>
      <div class="info-item">
        <span class="info-label">Niveau actuel</span>
        <span class="info-value highlight">{{ currentLevel }}%</span>
      </div>
      <div class="info-item">
        <span class="info-label">Restant</span>
        <span class="info-value highlight">{{ remainingSteres.toFixed(2) }} steres</span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.rack-info {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--color-text);
}

.info-value.highlight {
  color: var(--color-primary);
  font-weight: 700;
}
</style>
