import { onMounted, onUnmounted, ref } from 'vue'

/** Etat de la connexion reseau du navigateur */
export function useOnlineStatus() {
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  function update() {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { isOnline }
}
