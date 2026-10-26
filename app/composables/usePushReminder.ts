import { computed, ref } from 'vue'
import { apiClient } from '~/services/api'

const STORAGE_KEY = 'buche-log:push-reminder'

export interface ReminderPreferences {
  remindDay: number // 0 = dimanche
  remindHour: number
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function loadPreferences(): ReminderPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Stockage indisponible : valeurs par defaut
  }
  return { remindDay: 0, remindHour: 18 }
}

/**
 * Abonnement de l'appareil au rappel hebdomadaire (Web Push)
 */
export function usePushReminder() {
  const config = useRuntimeConfig()
  const vapidPublicKey = config.public.vapidPublicKey

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  const isConfigured = !!vapidPublicKey

  const subscription = ref<PushSubscription | null>(null)
  const permission = ref<NotificationPermission>(isSupported ? Notification.permission : 'denied')
  const preferences = ref<ReminderPreferences>(loadPreferences())
  const busy = ref(false)
  const error = ref<string | null>(null)

  const isSubscribed = computed(() => subscription.value !== null)

  async function getRegistration() {
    return navigator.serviceWorker.ready
  }

  async function refresh() {
    if (!isSupported) return
    const registration = await navigator.serviceWorker.getRegistration()
    subscription.value = (await registration?.pushManager.getSubscription()) ?? null
  }

  async function run(action: () => Promise<void>) {
    busy.value = true
    error.value = null
    try {
      await action()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inattendue'
    } finally {
      busy.value = false
    }
  }

  function subscribe(prefs: ReminderPreferences) {
    return run(async () => {
      permission.value = await Notification.requestPermission()
      if (permission.value !== 'granted') {
        throw new Error('Notifications refusées par le navigateur')
      }
      const registration = await getRegistration()
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }))
      await apiClient.savePushSubscription({
        endpoint: sub.endpoint,
        ...prefs,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      subscription.value = sub
      preferences.value = prefs
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      } catch {
        // Stockage indisponible : les preferences restent cote serveur
      }
    })
  }

  function unsubscribe() {
    return run(async () => {
      const sub = subscription.value
      if (!sub) return
      await apiClient.deletePushSubscription(sub.endpoint)
      await sub.unsubscribe()
      subscription.value = null
    })
  }

  function sendTest() {
    return run(async () => {
      if (subscription.value) await apiClient.sendTestPush(subscription.value.endpoint)
    })
  }

  return {
    isSupported,
    isConfigured,
    isSubscribed,
    permission,
    preferences,
    busy,
    error,
    refresh,
    subscribe,
    unsubscribe,
    sendTest,
  }
}
