<script setup lang="ts">
defineProps<{
  title?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
}>()
</script>

<template>
  <div class="base-card" :class="[`padding-${padding ?? 'medium'}`]">
    <h3 v-if="title" class="card-title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.padding-none {
  padding: 0;
}

.padding-small {
  padding: 0.75rem;
}

.padding-medium {
  padding: 1.25rem;
}

.padding-large {
  padding: 1.75rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--color-text);
}
</style>
