import { onBeforeUnmount, onMounted, ref } from 'vue'

export const DESKTOP_QUERY = '(min-width: 900px)'

/**
 * Indique si l'ecran est assez large pour la mise en page desktop
 */
export function useBreakpoint() {
  const isDesktop = ref(
    typeof window !== 'undefined' && window.matchMedia?.(DESKTOP_QUERY).matches === true,
  )
  let query: MediaQueryList | null = null

  function update(event: MediaQueryListEvent) {
    isDesktop.value = event.matches
  }

  onMounted(() => {
    query = window.matchMedia?.(DESKTOP_QUERY) ?? null
    if (!query) return
    isDesktop.value = query.matches
    query.addEventListener('change', update)
  })

  onBeforeUnmount(() => query?.removeEventListener('change', update))

  return { isDesktop }
}
