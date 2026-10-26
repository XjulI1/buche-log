import { useAuthStore } from '~/stores/authStore'

/** L'application exige un compte : les donnees vivent sur le serveur */
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated && to.name !== 'login') return navigateTo('/login')
  if (isAuthenticated && to.name === 'login') return navigateTo('/')
})
