<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSyncStore } from '@/stores/syncStore'
import { storeToRefs } from 'pinia'

const syncStore = useSyncStore()
const { isAuthenticated, user, status, error, syncEnabled } = storeToRefs(syncStore)

const apiUrl = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const mode = ref<'login' | 'register'>('login')
const connectionTested = ref(false)
const connectionValid = ref(false)

const canSubmit = computed(() => {
  return apiUrl.value.trim() && email.value.trim() && password.value.length >= 6
})

async function testConnection() {
  if (!apiUrl.value.trim()) return

  isLoading.value = true
  connectionTested.value = false

  try {
    connectionValid.value = await syncStore.testConnection(apiUrl.value.trim())
    connectionTested.value = true
  } catch {
    connectionValid.value = false
    connectionTested.value = true
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return

  isLoading.value = true

  try {
    if (mode.value === 'login') {
      await syncStore.login(apiUrl.value.trim(), email.value.trim(), password.value)
    } else {
      await syncStore.register(apiUrl.value.trim(), email.value.trim(), password.value)
    }

    // Reset form
    apiUrl.value = ''
    email.value = ''
    password.value = ''
    connectionTested.value = false
  } catch {
    // Error is handled in store
  } finally {
    isLoading.value = false
  }
}

async function handleLogout() {
  await syncStore.logout()
}

async function toggleSync() {
  if (syncEnabled.value) {
    await syncStore.disableSync()
  } else {
    await syncStore.enableSync()
  }
}
</script>

<template>
  <div class="sync-settings">
    <h2>Synchronisation</h2>

    <!-- Connected state -->
    <div v-if="isAuthenticated" class="connected-state">
      <div class="user-info">
        <div class="user-email">
          <span class="label">Connecté en tant que</span>
          <span class="value">{{ user?.email }}</span>
        </div>

        <div class="sync-toggle">
          <label class="toggle-label">
            <input type="checkbox" :checked="syncEnabled" @change="toggleSync" />
            <span>Synchronisation automatique</span>
          </label>
        </div>
      </div>

      <div class="status-info">
        <div class="status-row">
          <span class="label">Statut</span>
          <span class="value" :class="{ online: status.isOnline, offline: !status.isOnline }">
            {{ status.isOnline ? 'En ligne' : 'Hors ligne' }}
          </span>
        </div>

        <div class="status-row">
          <span class="label">Dernière synchronisation</span>
          <span class="value">
            {{
              status.lastSyncAt
                ? status.lastSyncAt.toLocaleString('fr-FR')
                : 'Jamais'
            }}
          </span>
        </div>

        <div v-if="status.pendingChanges > 0" class="status-row">
          <span class="label">Modifications en attente</span>
          <span class="value pending">{{ status.pendingChanges }}</span>
        </div>
      </div>

      <div class="actions">
        <button
          class="btn btn-primary"
          :disabled="!status.isOnline || status.isSyncing"
          @click="syncStore.triggerSync()"
        >
          {{ status.isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant' }}
        </button>

        <button class="btn btn-secondary" @click="handleLogout">Se déconnecter</button>
      </div>
    </div>

    <!-- Login/Register form -->
    <div v-else class="auth-form">
      <p class="description">
        Connectez-vous pour synchroniser vos données entre plusieurs appareils.
      </p>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Connexion</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">
          Inscription
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="apiUrl">URL du serveur</label>
          <div class="input-with-button">
            <input
              id="apiUrl"
              v-model="apiUrl"
              type="url"
              placeholder="https://api.example.com"
              required
            />
            <button type="button" class="test-btn" :disabled="!apiUrl || isLoading" @click="testConnection">
              Tester
            </button>
          </div>
          <span v-if="connectionTested" class="connection-status" :class="{ valid: connectionValid, invalid: !connectionValid }">
            {{ connectionValid ? 'Connexion OK' : 'Serveur inaccessible' }}
          </span>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="votre@email.com" required />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Minimum 6 caractères"
            minlength="6"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary" :disabled="!canSubmit || isLoading">
          {{ isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.sync-settings {
  padding: 1rem;
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.description {
  margin-bottom: 1.5rem;
  color: var(--color-text-muted, #6b7280);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tabs button {
  flex: 1;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  background: var(--color-primary, #3b82f6);
  border-color: var(--color-primary, #3b82f6);
  color: white;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button input {
  flex: 1;
}

.test-btn {
  padding: 0.75rem 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connection-status {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.connection-status.valid {
  color: var(--color-success, #22c55e);
}

.connection-status.invalid {
  color: var(--color-error, #ef4444);
}

.error-message {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.btn-secondary {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

/* Connected state */
.connected-state {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-info {
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 0.5rem;
}

.user-email {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.user-email .label {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-email .value {
  font-weight: 500;
}

.sync-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-label input {
  width: 1.25rem;
  height: 1.25rem;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-row .label {
  color: var(--color-text-muted, #6b7280);
}

.status-row .value.online {
  color: var(--color-success, #22c55e);
}

.status-row .value.offline {
  color: var(--color-error, #ef4444);
}

.status-row .value.pending {
  color: var(--color-warning, #f59e0b);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
