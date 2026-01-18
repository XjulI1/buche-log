<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/', name: 'home', label: 'Accueil', icon: '🏠' },
  { to: '/consumption', name: 'consumption', label: 'Saisie', icon: '📝' },
  { to: '/stats', name: 'stats', label: 'Stats', icon: '📊' },
  { to: '/settings', name: 'settings', label: 'Config', icon: '⚙️' },
]
</script>

<template>
  <nav class="app-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="nav-item"
      :class="{ active: route.name === item.name }"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  justify-content: space-around;
  padding: 0.5rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--color-text-muted);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
