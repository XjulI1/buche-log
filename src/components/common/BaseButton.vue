<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
}>()
</script>

<template>
  <button
    class="base-button"
    :class="[`variant-${variant ?? 'primary'}`, `size-${size ?? 'medium'}`]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.size-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.size-medium {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.size-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.variant-primary {
  background: var(--color-primary);
  color: white;
}

.variant-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.variant-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.variant-secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.variant-danger {
  background: var(--color-danger);
  color: white;
}

.variant-danger:hover:not(:disabled) {
  background: var(--color-danger-dark);
}

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
