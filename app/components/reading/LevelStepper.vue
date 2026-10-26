<script setup lang="ts">
const model = defineModel<number>({ required: true })

defineProps<{
  label: string
  presets?: number[]
}>()

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isNaN(value)) model.value = clamp(value)
}
</script>

<template>
  <div class="level-stepper">
    <span class="label">{{ label }}</span>
    <div class="row">
      <button type="button" class="step" :aria-label="`${label} : moins 5 %`" @click="model = clamp(model - 5)">
        −5
      </button>
      <label class="value">
        <input
          type="number"
          inputmode="numeric"
          min="0"
          max="100"
          :value="model"
          :aria-label="label"
          @change="onInput"
        >
        <span>%</span>
      </label>
      <button type="button" class="step" :aria-label="`${label} : plus 5 %`" @click="model = clamp(model + 5)">
        +5
      </button>
    </div>
    <div v-if="presets?.length" class="presets">
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        class="preset"
        :class="{ active: preset === model }"
        @click="model = preset"
      >
        {{ preset }} %
      </button>
    </div>
  </div>
</template>

<style scoped>
.level-stepper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
}

.value {
  display: flex;
  align-items: baseline;
  gap: 0.125rem;
  font-size: 1.375rem;
  font-weight: 700;
}

.value input {
  width: 3.2ch;
  border: none;
  border-bottom: 2px solid var(--color-border);
  background: transparent;
  font: inherit;
  color: var(--color-text);
  text-align: right;
  appearance: textfield;
  -moz-appearance: textfield;
}

.value input::-webkit-inner-spin-button,
.value input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.value input:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
}

.presets {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.preset {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.preset.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
</style>
