<script setup lang="ts">
import { useRoute } from 'vue-router'
import SyncStatus from '@/components/sync/SyncStatus.vue'

const route = useRoute()

const titles: Record<string, string> = {
  home: 'Buche-Log',
  rack: 'Configuration',
  consumption: 'Enregistrement',
  stats: 'Statistiques',
  settings: 'Parametres',
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">{{ titles[route.name as string] ?? 'Buche-Log' }}</h1>
      <SyncStatus />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  padding: 1rem 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
}
</style>
