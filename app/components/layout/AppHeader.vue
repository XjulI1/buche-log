<script setup lang="ts">
const route = useRoute()

const titles: Record<string, string> = {
  index: 'Buche-Log',
  rack: 'Porte-bûches',
  releve: 'Nouveau relevé',
  historique: 'Historique',
  stats: 'Statistiques',
  settings: 'Réglages',
  login: 'Connexion',
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">{{ titles[route.name as string] ?? 'Buche-Log' }}</h1>
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
  max-width: 1280px;
  margin: 0 auto;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
}

@media (min-width: 900px) {
  .app-header {
    padding: 1.25rem 2rem;
    background: var(--color-background);
  }

  .app-title {
    font-size: 1.5rem;
  }
}
</style>
