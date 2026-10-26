<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '~/components/common/BaseButton.vue'
import { useSyncStore } from '~/stores/syncStore'
import { usePushReminder } from '~/composables/usePushReminder'
import { useToast } from '~/composables/useToast'

const syncStore = useSyncStore()
const { isAuthenticated } = storeToRefs(syncStore)
const toast = useToast()
const reminder = usePushReminder()
const { isSubscribed, permission, preferences, busy, error } = reminder

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const hours = Array.from({ length: 24 }, (_, h) => h)

const remindDay = ref(preferences.value.remindDay)
const remindHour = ref(preferences.value.remindHour)

onMounted(() => reminder.refresh())

async function save() {
  await reminder.subscribe({ remindDay: remindDay.value, remindHour: remindHour.value })
  if (!error.value) toast.show('Rappel activé')
}

async function disable() {
  await reminder.unsubscribe()
  if (!error.value) toast.show('Rappel désactivé')
}

async function test() {
  await reminder.sendTest()
  if (!error.value) toast.show('Notification de test envoyée')
}
</script>

<template>
  <div class="push-reminder">
    <p class="description">
      Recevez une notification si aucun relevé n'a été saisi dans la semaine.
    </p>

    <p v-if="!reminder.isSupported" class="info">
      Ce navigateur ne gère pas les notifications. Sur iPhone, installez d'abord l'application
      sur l'écran d'accueil (Partager → « Sur l'écran d'accueil »), puis ouvrez-la depuis l'icône.
    </p>
    <p v-else-if="!reminder.isConfigured" class="info">
      Les notifications ne sont pas configurées sur le serveur (clés VAPID manquantes).
    </p>
    <p v-else-if="!isAuthenticated" class="info">
      Connectez-vous à la synchronisation : le serveur doit connaître vos relevés pour savoir
      s'il faut vous rappeler.
    </p>
    <p v-else-if="permission === 'denied'" class="info">
      Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur.
    </p>

    <template v-else>
      <div class="schedule">
        <label class="field">
          <span>Jour</span>
          <select v-model.number="remindDay">
            <option v-for="(day, index) in days" :key="day" :value="index">{{ day }}</option>
          </select>
        </label>
        <label class="field">
          <span>Heure</span>
          <select v-model.number="remindHour">
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }} h</option>
          </select>
        </label>
      </div>

      <p v-if="isSubscribed" class="status">
        ✓ Rappel actif le {{ days[preferences.remindDay]?.toLowerCase() }} à
        {{ preferences.remindHour }} h sur cet appareil.
      </p>

      <div class="actions">
        <BaseButton :loading="busy" @click="save">
          {{ isSubscribed ? 'Mettre à jour' : 'Activer le rappel' }}
        </BaseButton>
        <BaseButton v-if="isSubscribed" variant="secondary" :disabled="busy" @click="test">
          Tester
        </BaseButton>
        <BaseButton v-if="isSubscribed" variant="secondary" :disabled="busy" @click="disable">
          Désactiver
        </BaseButton>
      </div>
    </template>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.push-reminder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.description,
.info,
.status,
.error {
  margin: 0;
  font-size: 0.875rem;
}

.description {
  color: var(--color-text-secondary);
}

.info {
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.status {
  color: var(--color-success);
  font-weight: 600;
}

.error {
  color: var(--color-danger);
}

.schedule {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.field select {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font: inherit;
  font-weight: 400;
  color: var(--color-text);
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
