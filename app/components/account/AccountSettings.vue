<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseButton from '~/components/common/BaseButton.vue'
import { useAuthStore } from '~/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="account-settings">
    <div class="user-email">
      <span class="label">Connecté en tant que</span>
      <span class="value">{{ user?.email ?? '…' }}</span>
    </div>

    <BaseButton variant="secondary" @click="handleLogout">Se déconnecter</BaseButton>
  </div>
</template>

<style scoped>
.account-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-email {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-email .label {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-email .value {
  font-weight: 500;
}
</style>
