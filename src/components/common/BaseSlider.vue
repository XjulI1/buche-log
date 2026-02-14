<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<number>({ required: true })

const props = defineProps<{
  label?: string
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  unit?: string
}>()

const minVal = computed(() => props.min ?? 0)
const maxVal = computed(() => props.max ?? 100)

const percentage = computed(() => {
  return ((model.value - minVal.value) / (maxVal.value - minVal.value)) * 100
})
</script>

<template>
  <div class="slider-group">
    <div v-if="label || showValue" class="slider-header">
      <label v-if="label" class="slider-label">{{ label }}</label>
      <span v-if="showValue" class="slider-value">{{ model }}{{ unit ?? '%' }}</span>
    </div>
    <div class="slider-container">
      <input
        v-model.number="model"
        type="range"
        class="base-slider"
        :min="minVal"
        :max="maxVal"
        :step="step ?? 5"
        :style="{ '--progress': `${percentage}%` }"
      />
    </div>
    <div class="slider-marks">
      <span>{{ minVal }}{{ unit ?? '%' }}</span>
      <span>{{ maxVal }}{{ unit ?? '%' }}</span>
    </div>
  </div>
</template>

<style scoped>
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.slider-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.slider-container {
  padding: 0.5rem 0;
}

.base-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    var(--color-primary) var(--progress),
    var(--color-border) var(--progress)
  );
  appearance: none;
  cursor: pointer;
}

.base-slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: grab;
}

.base-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
