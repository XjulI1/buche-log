import { useSyncStore } from '~/stores/syncStore'

export default defineNuxtPlugin(async () => {
  const syncStore = useSyncStore()
  await syncStore.initialize()
})
