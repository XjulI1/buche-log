<script setup lang="ts">
import { useSyncStore } from '@/stores/syncStore'
import { storeToRefs } from 'pinia'

const syncStore = useSyncStore()
const { status, isAuthenticated, hasPendingChanges, syncEnabled } = storeToRefs(syncStore)

function formatLastSync(date: Date | null): string {
  if (!date) return 'Jamais'
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`

  return date.toLocaleDateString('fr-FR')
}

async function handleSync() {
  await syncStore.triggerSync()
}
</script>

<template>
  <div v-if="isAuthenticated" class="sync-status">
    <div class="sync-indicator" :class="{ offline: !status.isOnline, syncing: status.isSyncing }">
      <span v-if="status.isSyncing" class="status-text syncing">
        <span class="spinner"></span>
        Synchronisation...
      </span>
      <span v-else-if="!status.isOnline" class="status-text offline"> Hors ligne </span>
      <span v-else-if="hasPendingChanges" class="status-text pending">
        {{ status.pendingChanges }} modification(s) en attente
      </span>
      <span v-else class="status-text synced"> Synchronisé </span>
    </div>

    <div class="sync-info">
      <span class="last-sync">{{ formatLastSync(status.lastSyncAt) }}</span>
      <button
        v-if="status.isOnline && !status.isSyncing && syncEnabled"
        class="sync-button"
        @click="handleSync"
        title="Forcer la synchronisation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sync-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-soft);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.sync-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.status-text.synced {
  color: var(--color-success, #22c55e);
}

.status-text.pending {
  color: var(--color-warning, #f59e0b);
}

.status-text.offline {
  color: var(--color-error, #ef4444);
}

.status-text.syncing {
  color: var(--color-primary, #3b82f6);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.last-sync {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.75rem;
}

.sync-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: color 0.2s;
}

.sync-button:hover {
  color: var(--color-primary, #3b82f6);
}
</style>
