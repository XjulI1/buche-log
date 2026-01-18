import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// Initialize sync service after app is mounted
import { useSyncStore } from './stores/syncStore'
const syncStore = useSyncStore()
syncStore.initialize()
