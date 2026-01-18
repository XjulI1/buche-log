<script setup lang="ts">
const model = defineModel<string | number>()

defineProps<{
  label?: string
  type?: 'text' | 'number' | 'date'
  placeholder?: string
  min?: number
  max?: number
  step?: number
  required?: boolean
  error?: string
}>()
</script>

<template>
  <div class="input-group">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <input
      v-model="model"
      class="base-input"
      :class="{ 'has-error': error }"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      :required="required"
    />
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
}

.base-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

.base-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.base-input.has-error {
  border-color: var(--color-danger);
}

.error-message {
  font-size: 0.75rem;
  color: var(--color-danger);
}
</style>
