<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSlider from '@/components/common/BaseSlider.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import RackVisual from '@/components/rack/RackVisual.vue'
import type { ConsumptionFormData, ConsumptionType } from '@/types'
import { useRackStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { calculateConsumptionSteres } from '@/services/calculations/stere'

const props = defineProps<{
  type: ConsumptionType
  loading?: boolean
  currentLevel?: number
}>()

const emit = defineEmits<{
  submit: [data: ConsumptionFormData]
}>()

const rackStore = useRackStore()
const { rack } = storeToRefs(rackStore)

const percentage = ref(props.type === 'reload' ? 100 : 10)
const notes = ref('')

const title = computed(() => (props.type === 'reload' ? 'Rechargement' : 'Consommation'))

const description = computed(() =>
  props.type === 'reload'
    ? 'Indiquez le pourcentage de remplissage apres rechargement'
    : 'Indiquez le pourcentage de buches consomme',
)

const consumptionSteres = computed(() => {
  if (!rack.value || props.type === 'reload') return null
  return calculateConsumptionSteres(rack.value.volumeSteres, percentage.value)
})

const rackPreviewLevel = computed(() => {
  if (props.type === 'reload') {
    return percentage.value
  } else {
    // Pour la consommation, afficher le niveau après retrait
    const newLevel = (props.currentLevel ?? 100) - percentage.value
    return Math.max(0, newLevel)
  }
})

const maxConsumption = computed(() => {
  if (props.type === 'reload') return 100
  return props.currentLevel ?? 100
})

const canSubmit = computed(() => {
  if (props.type === 'reload') return true
  return (props.currentLevel ?? 0) > 0
})

function handleSubmit() {
  emit('submit', {
    type: props.type,
    percentage: percentage.value,
    date: new Date(),
    notes: notes.value || undefined,
  })
}
</script>

<template>
  <BaseCard :title="title">
    <p class="description">{{ description }}</p>

    <div class="visual-section">
      <RackVisual :level="rackPreviewLevel" :height="150" />
    </div>

    <form @submit.prevent="handleSubmit" class="form">
      <div v-if="type === 'consumption' && !canSubmit" class="warning-message">
        Le porte-buches est vide. Effectuez d'abord un rechargement.
      </div>

      <BaseSlider
        v-model="percentage"
        label="Pourcentage"
        :show-value="true"
        :max="maxConsumption"
      />

      <div v-if="consumptionSteres !== null" class="steres-preview">
        = {{ consumptionSteres.toFixed(2) }} steres
      </div>

      <div class="notes-group">
        <label class="notes-label">Notes (optionnel)</label>
        <textarea v-model="notes" class="notes-input" placeholder="Ajouter une note..." rows="2" />
      </div>

      <BaseButton type="submit" :loading="loading" :disabled="!canSubmit" size="large">
        {{ type === 'reload' ? 'Enregistrer le rechargement' : 'Enregistrer la consommation' }}
      </BaseButton>
    </form>
  </BaseCard>
</template>

<style scoped>
.description {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.visual-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-message {
  padding: 1rem;
  background-color: var(--color-warning-bg, #fff3cd);
  color: var(--color-warning-text, #856404);
  border: 1px solid var(--color-warning, #ffc107);
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
}

.notes-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.notes-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.notes-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}

.notes-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.steres-preview {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: -0.5rem;
}
</style>
