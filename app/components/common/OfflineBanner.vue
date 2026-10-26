<script setup lang="ts">
import { useOnlineStatus } from '~/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
</script>

<template>
  <div v-if="!isOnline" class="offline-banner" role="status">
    Hors ligne : une connexion est nécessaire pour consulter et enregistrer vos relevés.
  </div>
</template>

<style scoped>
.offline-banner {
  padding: 0.5rem 1rem;
  background: var(--color-danger, #ef4444);
  color: white;
  font-size: 0.875rem;
  text-align: center;
}
</style>
