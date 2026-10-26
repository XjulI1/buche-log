<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppNavigation from '~/components/layout/AppNavigation.vue'
import AppToast from '~/components/common/AppToast.vue'
import OfflineBanner from '~/components/common/OfflineBanner.vue'

const route = useRoute()
</script>

<template>
  <div class="app">
    <AppNavigation v-if="route.name !== 'login'" />
    <div class="app-main">
      <OfflineBanner />
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
