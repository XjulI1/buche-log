<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppNavigation from '~/components/layout/AppNavigation.vue'
import AppToast from '~/components/common/AppToast.vue'
</script>

<template>
  <div class="app">
    <AppNavigation />
    <div class="app-main">
      <AppHeader />
      <main class="main-content">
        <NuxtPage />
      </main>
    </div>
    <AppToast />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content {
  flex: 1;
}

@media (min-width: 900px) {
  .app {
    flex-direction: row;
  }
}
</style>
