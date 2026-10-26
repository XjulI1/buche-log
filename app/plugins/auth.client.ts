import { apiClient } from '~/services/api'
import { useAuthStore } from '~/stores/authStore'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  apiClient.setUnauthorizedHandler(() => {
    authStore.logout()
    navigateTo('/login')
  })

  await authStore.initialize()
})
