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

  return { message, show }
}
