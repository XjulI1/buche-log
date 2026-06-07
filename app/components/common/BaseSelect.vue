<script setup lang="ts">
const model = defineModel<string | number>()

defineProps<{
  label?: string
  options: { value: string | number; label: string }[]
  required?: boolean
}>()
</script>

<template>
  <div class="select-group">
    <label v-if="label" class="select-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <select v-model="model" class="base-select" :required="required">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.select-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.select-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
}

.base-select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.base-select:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
