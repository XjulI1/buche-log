import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { syncService, apiClient } from '@/services/sync'
import type { SyncStatus } from '@/types'

export const useSyncStore = defineStore('sync', () => {
  const isConfigured = ref(false)
  const isAuthenticated = ref(false)
  const status = ref<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncAt: null,
    lastError: null,
  })
  const user = ref<{ id: string; email: string } | null>(null)
  const error = ref<string | null>(null)

  const hasPendingChanges = computed(() => status.value.pendingChanges > 0)
  const syncEnabled = computed(() => syncService.isEnabled())

  async function initialize(): Promise<void> {
    await syncService.initialize()
    status.value = await syncService.getStatus()
    isConfigured.value = syncService.isConfigured()
    isAuthenticated.value = syncService.isConfigured()

    if (isAuthenticated.value) {
      try {
        user.value = await apiClient.getCurrentUser()
      } catch {
        // Token might be invalid
        isAuthenticated.value = false
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  function updateOnlineStatus(): void {
    status.value.isOnline = navigator.onLine
  }

  async function login(apiUrl: string, email: string, password: string): Promise<void> {
    error.value = null
    try {
      apiClient.configure(apiUrl, null)
      const response = await apiClient.login(email, password)
      await syncService.configure(apiUrl, response.token)
      isConfigured.value = true
      isAuthenticated.value = true
      user.value = response.user

      // Trigger initial sync
      await triggerSync()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de connexion'
      throw e
    }
  }

  async function register(apiUrl: string, email: string, password: string): Promise<void> {
    error.value = null
    try {
      apiClient.configure(apiUrl, null)
      const response = await apiClient.register(email, password)
      await syncService.configure(apiUrl, response.token)
      isConfigured.value = true
      isAuthenticated.value = true
      user.value = response.user

      // Trigger initial sync
      await triggerSync()
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Erreur d'inscription"
      throw e
    }
  }

  async function logout(): Promise<void> {
    await syncService.logout()
    isAuthenticated.value = false
    isConfigured.value = false
    user.value = null
    status.value = {
      isOnline: navigator.onLine,
      isSyncing: false,
      pendingChanges: 0,
      lastSyncAt: null,
      lastError: null,
    }
  }

  async function triggerSync(): Promise<void> {
    if (!isConfigured.value) return

    status.value.isSyncing = true
    error.value = null

    try {
      await syncService.sync()
      status.value = await syncService.getStatus()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur de synchronisation'
      status.value.lastError = errorMessage
      error.value = errorMessage
    } finally {
      status.value.isSyncing = false
    }
  }

  async function refreshStatus(): Promise<void> {
    status.value = await syncService.getStatus()
  }

  async function enableSync(): Promise<void> {
    await syncService.enable()
    await refreshStatus()
  }

  async function disableSync(): Promise<void> {
    await syncService.disable()
    await refreshStatus()
  }

  async function testConnection(apiUrl: string): Promise<boolean> {
    const previousConfig = apiClient.getConfig()
    try {
      apiClient.configure(apiUrl, null)
      await apiClient.checkHealth()
      return true
    } catch {
      return false
    } finally {
      apiClient.configure(previousConfig.baseUrl, previousConfig.token)
    }
  }

  return {
    isConfigured,
    isAuthenticated,
    status,
    user,
    error,
    hasPendingChanges,
    syncEnabled,
    initialize,
    login,
    register,
    logout,
    triggerSync,
    refreshStatus,
    enableSync,
    disableSync,
    testConnection,
  }
})
