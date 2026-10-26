<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/', name: 'index', label: 'Accueil', icon: '🏠' },
  { to: '/releve', name: 'releve', label: 'Relevé', icon: '➕' },
  { to: '/historique', name: 'historique', label: 'Historique', icon: '📋' },
  { to: '/stats', name: 'stats', label: 'Stats', icon: '📊' },
  { to: '/settings', name: 'settings', label: 'Réglages', icon: '⚙️' },
]
</script>

<template>
  <nav class="app-nav" aria-label="Navigation principale">
    <div class="brand">
      <span class="brand-icon">🪵</span>
      <span class="brand-name">Buche-Log</span>
    </div>
    <NuxtLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="nav-item"
      :class="{ active: route.name === item.name, primary: item.name === 'releve' }"
      :aria-current="route.name === item.name ? 'page' : undefined"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
/* Mobile : barre d'onglets en bas */
.app-nav {
  display: flex;
  justify-content: space-around;
  padding: 0.375rem 0.25rem calc(0.375rem + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.brand {
  display: none;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0.25rem;
  text-decoration: none;
  color: var(--color-text-muted);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  text-decoration: none;
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.6875rem;
  font-weight: 600;
}

/* Desktop : barre laterale */
@media (min-width: 900px) {
  .app-nav {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 220px;
    flex-shrink: 0;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.25rem;
    padding: 1.25rem 0.75rem;
    border-top: none;
    border-right: 1px solid var(--color-border);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem 1.25rem;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .nav-item {
    flex: none;
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
  }

  .nav-item:hover:not(.active) {
    background: var(--color-surface-hover);
  }

  .nav-label {
    font-size: 0.9375rem;
  }
}
</style>
