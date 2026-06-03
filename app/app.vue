<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppNavigation from '~/components/layout/AppNavigation.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="main-content">
      <NuxtPage />
    </main>
    <AppNavigation />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: 4rem;
}
</style>
