import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient, ApiError } from '~/services/api'
import type { AuthResponse, AuthUser } from '#shared/types'
import { useRackStore } from './rackStore'
import { useConsumptionStore } from './consumptionStore'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(apiClient.getToken())
  const user = ref<AuthUser | null>(null)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  async function initialize(): Promise<void> {
    if (!token.value) return
    try {
      user.value = await apiClient.getCurrentUser()
    } catch (e) {
      // Token refuse : deconnexion. Serveur injoignable : on garde la session.
      if (e instanceof ApiError && e.status === 401) logout()
    }
  }

  function setSession(response: AuthResponse): void {
    apiClient.setToken(response.token)
    token.value = response.token
    user.value = response.user
  }

  async function authenticate(request: Promise<AuthResponse>, fallback: string): Promise<void> {
    error.value = null
    try {
      setSession(await request)
    } catch (e) {
      error.value = e instanceof Error ? e.message : fallback
      throw e
    }
  }

  function login(email: string, password: string): Promise<void> {
    return authenticate(apiClient.login(email, password), 'Erreur de connexion')
  }

  function register(email: string, password: string): Promise<void> {
    return authenticate(apiClient.register(email, password), "Erreur d'inscription")
  }

  function logout(): void {
    apiClient.setToken(null)
    token.value = null
    user.value = null
    // Les donnees affichees appartiennent a l'utilisateur deconnecte
    useRackStore().$patch({ rack: null })
    useConsumptionStore().$patch({ entries: [] })
  }

  return {
    user,
    error,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
  }
})
