<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/authStore'

const emit = defineEmits<{ authenticated: [] }>()

const authStore = useAuthStore()
const { error } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const mode = ref<'login' | 'register'>('login')

const canSubmit = computed(() => email.value.trim() && password.value.length >= 6)

async function handleSubmit() {
  if (!canSubmit.value) return

  isLoading.value = true

  try {
    if (mode.value === 'login') {
      await authStore.login(email.value.trim(), password.value)
    } else {
      await authStore.register(email.value.trim(), password.value)
    }

    email.value = ''
    password.value = ''
    emit('authenticated')
  } catch {
    // Error is handled in store
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <p class="description">
      Connectez-vous pour accéder à vos relevés depuis tous vos appareils.
    </p>

    <div class="tabs">
      <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Connexion</button>
      <button :class="{ active: mode === 'register' }" @click="mode = 'register'">
        Inscription
      </button>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" placeholder="votre@email.com" required >
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
        >
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button type="submit" class="btn btn-primary" :disabled="!canSubmit || isLoading">
        {{ isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
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
</style>
