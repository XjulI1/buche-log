import { ref } from 'vue'

const message = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Message de confirmation ephemere, partage par toute l'application
 */
export function useToast() {
  function show(text: string, duration = 2500) {
    message.value = text
    clearTimeout(timer)
    timer = setTimeout(() => (message.value = null), duration)
  }

  /** Affiche l'erreur d'une action (ex. serveur injoignable) */
  function showError(error: unknown, fallback = 'Une erreur est survenue') {
    show(error instanceof Error ? error.message : fallback, 4000)
  }

  return { message, show, showError }
}
